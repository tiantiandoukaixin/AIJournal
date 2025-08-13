const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加对 .ts 和 .tsx 文件的支持
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// 确保正确处理 TypeScript 文件
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');

// 添加对 expo-modules-core 的特殊处理
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;