import { Platform } from 'react-native';
import { platformStyles, colors, spacing, fontSize } from './platformStyles';

// Web端特定的样式增强
export const webStyles = Platform.OS === 'web' ? {
  // 容器最大宽度限制
  containerMaxWidth: {
    maxWidth: 480,
    marginHorizontal: 'auto',
    width: '100%',
  },
  
  // 鼠标悬停效果
  hoverEffect: {
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },
  
  // 按钮悬停效果
  buttonHover: {
    ':hover': {
      opacity: 0.8,
      transform: 'translateY(-1px)',
    },
  },
  
  // 输入框焦点效果
  inputFocus: {
    ':focus': {
      borderColor: colors.primary,
      outline: 'none',
      boxShadow: `0 0 0 2px ${colors.primary}20`,
    },
  },
  
  // 滚动条样式
  scrollbar: {
    '::-webkit-scrollbar': {
      width: '6px',
    },
    '::-webkit-scrollbar-track': {
      background: colors.surface,
    },
    '::-webkit-scrollbar-thumb': {
      background: colors.textTertiary,
      borderRadius: '3px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      background: colors.textSecondary,
    },
  },
  
  // 卡片悬停效果
  cardHover: {
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    },
  },
  
  // 响应式网格
  responsiveGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing.lg,
  },
  
  // 文本选择样式
  textSelection: {
    '::selection': {
      backgroundColor: `${colors.primary}30`,
      color: colors.text,
    },
  },
  
  // 禁用文本选择
  noSelect: {
    userSelect: 'none',
    WebkitUserSelect: 'none',
    MozUserSelect: 'none',
    msUserSelect: 'none',
  },
  
  // 平滑滚动
  smoothScroll: {
    scrollBehavior: 'smooth',
  },
  
  // 模态框背景模糊
  modalBackdrop: {
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  },
  
  // 加载动画
  loadingAnimation: {
    '@keyframes spin': {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    animation: 'spin 1s linear infinite',
  },
  
  // 淡入动画
  fadeIn: {
    '@keyframes fadeIn': {
      '0%': { opacity: 0, transform: 'translateY(10px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' },
    },
    animation: 'fadeIn 0.3s ease-out',
  },
  
  // 媒体查询样式
  mediaQueries: {
    mobile: '@media (max-width: 768px)',
    tablet: '@media (min-width: 769px) and (max-width: 1024px)',
    desktop: '@media (min-width: 1025px)',
  },
  
  // 打印样式
  print: {
    '@media print': {
      backgroundColor: 'white !important',
      color: 'black !important',
      boxShadow: 'none !important',
    },
  },
} : {};

// Web端特定的组件样式
export const webComponentStyles = Platform.OS === 'web' ? {
  // 主容器
  mainContainer: {
    ...webStyles.containerMaxWidth,
    minHeight: '100vh',
    backgroundColor: colors.background,
  },
  
  // 导航栏
  navigation: {
    position: 'sticky',
    bottom: 0,
    zIndex: 1000,
    ...webStyles.containerMaxWidth,
  },
  
  // 内容区域
  contentArea: {
    ...webStyles.containerMaxWidth,
    padding: spacing.lg,
    paddingBottom: 80, // 为底部导航留空间
  },
  
  // 聊天容器
  chatContainer: {
    ...webStyles.containerMaxWidth,
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  
  // 表单容器
  formContainer: {
    ...webStyles.containerMaxWidth,
    padding: spacing.xl,
  },
  
  // 按钮组
  buttonGroup: {
    display: 'flex',
    gap: spacing.md,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  
  // 卡片网格
  cardGrid: {
    ...webStyles.responsiveGrid,
    padding: spacing.lg,
  },
} : {};

export default {
  webStyles,
  webComponentStyles,
};