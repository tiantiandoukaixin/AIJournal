# GitHub 代码上传指南

## 当前问题
由于网络连接不稳定，Git推送到GitHub失败。以下是几种解决方案：

## 方案1：网页界面上传（推荐）

### 步骤：
1. **访问GitHub**：
   - 打开 https://github.com
   - 登录你的账户

2. **创建新仓库**：
   - 点击右上角 "+" 号
   - 选择 "New repository"
   - 仓库名：`AIJournal`
   - 设置为 Public
   - 不要初始化 README
   - 点击 "Create repository"

3. **上传文件**：
   - 在新建的仓库页面，点击 "uploading an existing file"
   - 将项目文件夹中的所有文件拖拽到上传区域
   - 重要文件包括：
     - `App.js`
     - `app.json`
     - `eas.json`
     - `package.json`
     - `src/` 文件夹
     - `assets/` 文件夹

4. **提交更改**：
   - 在页面底部填写提交信息："Initial commit: AIJournal app"
   - 点击 "Commit changes"

## 方案2：修复Git配置

### 尝试以下命令：
```bash
# 配置Git使用更长的超时时间
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999

# 重新尝试推送
git push -u origin main
```

### 如果仍然失败，尝试SSH方式：
```bash
# 移除HTTPS远程仓库
git remote remove origin

# 添加SSH远程仓库（需要先配置SSH密钥）
git remote add origin git@github.com:yutianyuan2020/AIJournal.git
git push -u origin main
```

## 方案3：使用GitHub Desktop

1. **下载GitHub Desktop**：
   - 访问 https://desktop.github.com/
   - 下载并安装

2. **克隆仓库**：
   - 在GitHub Desktop中登录
   - 选择 "Clone a repository from the Internet"
   - 输入仓库URL

3. **同步文件**：
   - 将项目文件复制到克隆的文件夹
   - 在GitHub Desktop中提交并推送

## 完成后的下一步

一旦代码成功上传到GitHub：

1. **访问Expo控制台**：
   - 打开 https://expo.dev/
   - 登录账户
   - 进入 AIJournal 项目

2. **关联GitHub仓库**：
   - 在项目设置中连接GitHub仓库
   - 选择 `yutianyuan2020/AIJournal`

3. **触发构建**：
   - 在 Builds 页面点击 "Create a build"
   - 选择 Android 平台
   - 选择 preview 配置
   - 开始构建

## 注意事项

- 确保所有重要文件都已上传
- 检查 `eas.json` 配置是否正确
- 构建过程可能需要10-20分钟
- 构建完成后会收到邮件通知

推荐使用**方案1（网页上传）**，这是最稳定可靠的方式。