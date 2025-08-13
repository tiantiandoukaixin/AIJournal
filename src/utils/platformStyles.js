import { Platform, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 平台特定的样式配置
export const platformStyles = {
  // 状态栏和安全区域
  statusBarHeight: Platform.OS === 'ios' ? 44 : Platform.OS === 'android' ? 24 : 0,
  safeAreaTop: Platform.OS === 'ios' ? 60 : Platform.OS === 'android' ? 40 : 20,
  safeAreaBottom: Platform.OS === 'ios' ? 34 : 16,
  
  // 阴影效果 - Web端使用box-shadow，移动端使用elevation
  shadow: Platform.OS === 'web' ? {
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  
  // 轻微阴影
  lightShadow: Platform.OS === 'web' ? {
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // 字体权重 - Web端和移动端的差异
  fontWeight: {
    light: Platform.OS === 'web' ? '300' : '300',
    normal: Platform.OS === 'web' ? '400' : '400',
    medium: Platform.OS === 'web' ? '500' : '500',
    semibold: Platform.OS === 'web' ? '600' : '600',
    bold: Platform.OS === 'web' ? '700' : '700',
    heavy: Platform.OS === 'web' ? '800' : '800',
  },
  
  // 响应式布局
  responsive: {
    isTablet: width >= 768,
    isDesktop: width >= 1024,
    maxWidth: Platform.OS === 'web' ? Math.min(width, 480) : width,
    padding: Platform.OS === 'web' && width >= 768 ? 40 : 20,
  },
  
  // 模态框样式
  modal: {
    presentationStyle: Platform.OS === 'ios' ? 'pageSheet' : 'slide',
    animationType: 'slide',
  },
  
  // 输入框样式
  input: {
    fontSize: Platform.OS === 'web' ? 16 : 16,
    lineHeight: Platform.OS === 'web' ? 24 : 22,
    paddingVertical: Platform.OS === 'web' ? 12 : 12,
    paddingHorizontal: Platform.OS === 'web' ? 16 : 16,
  },
  
  // 按钮样式
  button: {
    borderRadius: Platform.OS === 'web' ? 12 : 16,
    paddingVertical: Platform.OS === 'web' ? 14 : 18,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 24,
  },
};

// 统一的颜色主题
export const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceSecondary: '#F8F8F8',
  text: '#2C2C2E',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  border: '#E8E8E8',
  borderLight: '#F0F0F0',
  shadow: '#000000',
  chat: {
    userMessage: '#29B6F6',
    userMessageText: '#FFFFFF',
    aiMessage: '#FFFFFF',
    aiMessageText: '#2C2C2E',
    inputBackground: '#F8F9FA',
    sendButton: '#5AC8FA',
  },
};

// 统一的间距系统
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// 统一的字体大小
export const fontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 36,
};

export default {
  platformStyles,
  colors,
  spacing,
  fontSize,
};