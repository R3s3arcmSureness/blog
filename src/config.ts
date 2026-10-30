/** 部署在 https://<user>.github.io/blog/ 子路径下，所有内部链接需带此前缀 */
export const BASE = '/blog';

/** 给站内路径补上 base 前缀 */
export const withBase = (path: string): string =>
  path === '/' ? `${BASE}/` : `${BASE}${path}`;

export const SITE = {
  title: 'R3s3arcm',
  titleLong: 'R3s3arcmSureness',
  tagline: 'Reverse Engineering · Security Research · Automation',
  description:
    '安全逆向与自动化工具的实验场。分享 APK 静态分析、动态插桩、Agent 安全与隐私合规方向的实践笔记。',
  author: 'R3s3arcm',
  email: 'r3s3arcm@example.com',
  github: 'https://github.com/R3s3arcmSureness',
  avatar: 'https://github.com/R3s3arcmSureness.png',
  locale: 'zh-CN',
} as const;

export const NAV = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/blog' },
  { label: '项目', href: '/projects' },
  { label: '关于', href: '/about' },
] as const;

export const REPOS = [
  {
    name: 'AScan',
    desc: 'APK 自动化扫描引擎：自研 DEX 解析 + 规则引擎，零外部工具即可出报告。',
    href: 'https://github.com/R3s3arcmSureness/AScan',
    tags: ['Android', 'Static Analysis', 'Python'],
    accent: '#7C5CFF',
  },
  {
    name: 'agentguard',
    desc: 'Agent 安全护栏：对 AI Agent 的工具调用与提示注入进行实时检测与阻断。',
    href: 'https://github.com/R3s3arcmSureness/agentguard',
    tags: ['LLM', 'Security', 'Agent'],
    accent: '#00E5C7',
  },
  {
    name: 'raven-boot',
    desc: '隐蔽启动框架：抹除进程名、端口、路径与线程名特征的自启动方案。',
    href: 'https://github.com/R3s3arcmSureness/raven-boot',
    tags: ['Frida', 'Anti-Detect', 'Android'],
    accent: '#FF3D71',
  },
  {
    name: 'sensitive-detector',
    desc: '敏感信息检测器：跨文件扫描密钥、凭证与隐私数据，输出可追溯的证据链。',
    href: 'https://github.com/R3s3arcmSureness/sensitive-detector',
    tags: ['Scanner', 'Privacy', 'CI'],
    accent: '#FFB020',
  },
  {
    name: 'ARTEX',
    desc: '艺术化文本处理工具集，源自 mhtsec/ARTEX 的增强分支。',
    href: 'https://github.com/R3s3arcmSureness/ARTEX',
    tags: ['Tooling', 'Text'],
    accent: '#4EA8FF',
  },
  {
    name: 'comet-',
    desc: '轻量级实验项目，记录一些有趣的实现尝试与踩坑过程。',
    href: 'https://github.com/R3s3arcmSureness/comet-',
    tags: ['Experiment', 'Misc'],
    accent: '#8A94A6',
  },
] as const;
