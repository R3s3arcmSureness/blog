/** 部署在 https://<user>.github.io/blog/ 子路径下，所有内部链接需带此前缀 */
export const BASE = '/blog';

/**
 * 给站内路径补上 base 前缀，并统一补齐尾斜杠
 * （GitHub Pages 对无尾斜杠路径会 301 到带斜杠版本，统一后少一次跳转）
 */
export const withBase = (path: string): string => {
  const p = path === '/' ? '' : path.replace(/\/+$/, '');
  return `${BASE}${p}/`;
};

export const SITE = {
  title: 'R3s3arcm',
  titleLong: 'R3s3arcmSureness',
  tagline: 'Reverse Engineering · Security Research · Automation',
  description: 'R3s3arcm 的个人博客。',
  author: 'R3s3arcm',
  email: '',
  github: 'https://github.com/R3s3arcmSureness',
  avatar: 'https://github.com/R3s3arcmSureness.png',
  locale: 'zh-CN',
} as const;

export const NAV = [
  { label: '首页', href: '/' },
  { label: '文章', href: '/posts' },
  { label: '项目', href: '/projects' },
  { label: '关于', href: '/about' },
] as const;

/**
 * 开源项目清单
 * desc / lang / stars 均取自 GitHub API 真实数据，未填写的保持为空字符串。
 */
export const REPOS = [
  {
    name: 'comet-',
    desc: '移动安全隐私合规小模型',
    lang: 'Python',
    stars: 4,
    href: 'https://github.com/R3s3arcmSureness/comet-',
    accent: '#00E5C7',
  },
  {
    name: 'sensitive-detector',
    desc: '',
    lang: 'Python',
    stars: 2,
    href: 'https://github.com/R3s3arcmSureness/sensitive-detector',
    accent: '#7C5CFF',
  },
  {
    name: 'AScan',
    desc: '',
    lang: 'Go',
    stars: 1,
    href: 'https://github.com/R3s3arcmSureness/AScan',
    accent: '#4EA8FF',
  },
  {
    name: 'agentguard',
    desc: '',
    lang: 'Go',
    stars: 0,
    href: 'https://github.com/R3s3arcmSureness/agentguard',
    accent: '#FFB020',
  },
] as const;
