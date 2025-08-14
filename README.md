# 饮食教练 (Diet Coach) 🥗💪

一个基于AI的智能饮食运动记录应用，帮助用户管理健康生活方式。

## 📱 应用特性

### 🏠 首页功能
- **营养概览**: 实时显示今日热量摄入、蛋白质、碳水化合物、脂肪统计
- **智能记录**: 输入饮食或运动描述，AI自动分析营养成分和热量消耗
- **AI聊天助手**: 与专业营养师「于渺」对话，获得个性化健康建议
- **营养建议**: AI根据今日数据生成个性化饮食建议
- **快捷添加**: 预设8种常用食物和4种运动的快速记录按钮

### 🗄️ 数据管理
- **四大数据库**: 饮食记录、运动记录、聊天记录、营养建议
- **完整CRUD**: 查看、编辑、删除所有历史记录
- **数据导出**: 支持单表或全部数据导出为TXT格式
- **时间追踪**: 所有记录包含详细时间戳

### ⚙️ 设置中心
- **API配置**: DeepSeek API密钥管理和连接测试
- **应用偏好**: 推送通知、自动备份等个性化设置
- **数据安全**: 支持完全重置和数据清理

## 🤖 AI助手「于渺」

- **专业背景**: 24岁女性健身和营养学专家
- **性格特点**: 活泼可爱、阳光向上、比较话痨
- **智能分析**: 基于用户历史数据提供个性化建议
- **实时对话**: 支持流式响应的自然对话体验

## 🛠️ 技术架构

### 前端框架
- **React Native**: 跨平台移动应用开发
- **Expo**: 快速开发和部署工具
- **React Navigation**: 应用导航管理
- **React Native Paper**: UI组件库

### 数据存储
- **SQLite**: 本地数据库，保护用户隐私
- **AsyncStorage**: 应用设置和配置存储

### AI集成
- **DeepSeek API**: 智能分析和对话服务
- **流式响应**: 实时AI交互体验

### UI设计
- **iOS 26风格**: 纯白极简设计
- **响应式布局**: 适配不同屏幕尺寸
- **无障碍支持**: 符合可访问性标准

## 📦 项目结构

```
饮食教练/
├── App.js                 # 应用入口
├── app.json              # Expo配置
├── package.json          # 依赖管理
├── src/
│   ├── components/       # 可复用组件
│   │   └── BottomTabNavigator.js
│   ├── screens/          # 页面组件
│   │   ├── HomeScreen.js
│   │   ├── RecordScreen.js
│   │   ├── ChatScreen.js
│   │   ├── DatabaseScreen.js
│   │   └── SettingsScreen.js
│   ├── database/         # 数据库管理
│   │   └── database.js
│   ├── services/         # 外部服务
│   │   └── aiService.js
│   └── utils/           # 工具函数
│       └── exportUtils.js
├── assets/              # 静态资源
└── test-app.js         # 功能测试脚本
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn
- Expo CLI
- Android Studio (Android开发)
- Xcode (iOS开发，仅macOS)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd 饮食教练
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npx expo start
   ```

4. **在设备上测试**
   - 安装 Expo Go 应用
   - 扫描二维码在手机上预览
   - 或使用模拟器进行测试

### API配置

1. 获取 DeepSeek API 密钥
2. 在应用设置页面输入API密钥
3. 点击"测试连接"验证配置

## 📱 使用指南

### 记录饮食
1. 点击首页"记录"按钮
2. 选择"饮食记录"
3. 输入食物描述（如"一碗米饭和一个鸡蛋"）
4. 点击"AI分析"获取营养信息
5. 确认或修改数据后保存

### 记录运动
1. 点击首页"记录"按钮
2. 选择"运动记录"
3. 输入运动描述（如"跑步30分钟"）
4. 点击"AI分析"获取消耗信息
5. 确认或修改数据后保存

### AI聊天
1. 点击首页"与于渺聊天"按钮
2. 输入健康相关问题
3. AI助手会基于你的历史数据给出个性化建议

### 数据管理
1. 进入"数据库"页面
2. 选择要查看的数据类型
3. 可以编辑、删除或导出数据

## 🔧 开发指南

### 添加新功能
1. 在相应的screens目录下创建新页面
2. 在database.js中添加数据库操作
3. 在BottomTabNavigator.js中注册新路由

### 自定义AI提示词
编辑 `src/services/aiService.js` 中的提示词常量：
- `DIET_ANALYSIS_PROMPT`: 饮食分析提示词
- `EXERCISE_ANALYSIS_PROMPT`: 运动分析提示词
- `YUMIAO_SYSTEM_PROMPT`: AI助手人格设定

### 数据库扩展
在 `src/database/database.js` 中：
1. 添加新表的CREATE语句
2. 创建对应的操作函数
3. 导出新的操作对象

## 📦 打包部署

### Android APK
```bash
# 构建APK
eas build --platform android

# 或使用Expo经典构建
expo build:android
```

### iOS应用
```bash
# 构建iOS应用（需要Apple开发者账号）
eas build --platform ios
```

## 🧪 测试

运行功能测试脚本：
```bash
node test-app.js
```

测试内容包括：
- 数据库初始化和操作
- API连接测试
- AI分析功能验证

## 🔒 隐私安全

- **本地存储**: 所有用户数据存储在设备本地SQLite数据库
- **API安全**: DeepSeek API密钥加密存储
- **数据控制**: 用户完全控制自己的数据，可随时删除
- **无追踪**: 应用不收集或上传个人数据

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：
- 提交 Issue
- 发送邮件至开发者
- 查看文档和FAQ

## 🎯 路线图

### 即将推出
- [ ] 图像识别功能（拍照识别食物）
- [ ] 数据可视化图表
- [ ] 社交分享功能
- [ ] 多语言支持
- [ ] 深色模式
- [ ] 云端同步（可选）

### 长期计划
- [ ] Apple Health / Google Fit 集成
- [ ] 智能手表支持
- [ ] 营养师在线咨询
- [ ] 社区功能

---

**饮食教练** - 让AI成为你的健康伙伴 🌟