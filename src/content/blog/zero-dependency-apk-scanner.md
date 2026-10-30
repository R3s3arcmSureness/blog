---
title: '为什么我坚持自研 DEX 解析器，而不是接 jadx'
description: '把静态分析的成败押在外部工具上，等于把报告的可复现性交给别人。本文拆解自研 DEX 解析 + 规则引擎的架构取舍。'
pubDate: 2026-09-18
tags: ['Android', 'Static Analysis', '逆向工程']
featured: true
readingTime: '8 分钟'
---

做 Android 静态分析的时候，市面上的工具已经把 90% 的活干完了。那为什么还要自己写一套？

答案是：**当工具失效的时候，你手里得有点东西。**

## 真实的痛点

jadx 在某些加固样本上会直接抛异常退出，apktool 的 smali 反编译偶尔会把控制流还原成完全错误的样子，Droid ASC 这类新工具确实更强但引入了一整套 Java 运行时依赖。

我们做过一次完整的基线对比，结论很朴素：

| 方案 | 基线检出 | 耗时 | 环境依赖 |
|---|---|---|---|
| 自研 DEX 解析 + 规则引擎 | 基准 100% | 12.4s | 无（纯 Python） |
| jadx 增强 | 基准 100% | 68.9s | JRE 11+ |
| apktool + 自研 | 基准 94% | 91.2s | JRE + Android SDK |

关键差异不在检出率，在**第 4 行**：自研方案在任何一台装了 Python 3.9 的机器上都能跑，不需要 JRE，不需要 SDK，不受工具版本回退影响。

## 架构拆解

整个扫描器分三层，每层都可以独立降级：

```text
APK
 └─ Unpack      解包 ZIP → 过滤 dex/arsc/resources
     └─ Parse   DEX 字节码 → 常量池 / 方法表 / 指令流
         └─ Rule 规则引擎 → 命中项 + 证据链
```

### 第 1 层：Unpack

只关心四类文件：`classes*.dex`、`resources.arsc`、`AndroidManifest.xml`、`assets/`。用 `zipfile` 直接读，不做完整解包——省内存，也让整件事能塞进 CI runner。

### 第 2 层：Parse

DEX 格式本身不复杂，难点在**容错**。真实的 APK 里经常有被改坏的 header、被截断的 method_id_item。我们的做法是：

```python
def _read_uleb128(self, buf: bytes, off: int) -> tuple[int, int]:
    """读取 ULEB128，容忍越界返回而不抛异常。"""
    result = 0
    shift = 0
    while off < len(buf) and shift < 35:
        byte = buf[off]
        off += 1
        result |= (byte & 0x7F) << shift
        if not byte & 0x80:
            break
        shift += 7
    return result, off
```

每个字段读取都返回 `(value, new_offset)`，解析器层面完全不用 try/except 兜底。坏数据只会让单个 item 变成 0，不会让整次扫描崩掉——**这是"零外部工具也能出报告"的地基**。

### 第 3 层：Rule

规则用 YAML 描述，和解析层彻底解耦：

```yaml
- id: ANDROID-LOG-LEAK
  severity: high
  match:
    call: "android.util.Log.d"
    args_contains: ["password", "token", "secret"]
  message: "敏感信息被写入 logcat"
```

新增检测规则不需要碰代码，也不需要重新编译。这对需要快速响应新样本的场景很关键。

## 代价是什么

不吹。纯自研的代价是真实的：

1. **覆盖面需要时间**。dex 解析器写下来大概两周，但 smali 语义、混淆识别这些真正耗时间。
2. **对抗成本高**。加固厂商针对你的解析器做对抗，比针对 jadx 做对抗便宜得多。
3. **人才难招**。愿意读 DEX 字节码规范的人不多。

所以最终架构是**自研为主、外部工具为可选增强**。jadx 装了就用，能多检出一些 DEX 层面的线索；没装也必须能跑完并出报告。任何一个增强工具缺失都不能导致出不了报告——这是硬约束，不是优先级。

## 一点感想

工具选型的讨论最后总会落到"哪个更强"上，但更有价值的问题是：**我的结论能不能被复现？**

当报告里写"检测到 X"的时候，读报告的人需要能自己跑一遍验证。自研方案在这个环节是自洽的——代码在仓库里，环境要求写清楚了，谁都能跑。

这可能才是"自研"真正的收益。
