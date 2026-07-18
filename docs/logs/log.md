# 📝 我的记录

每天记录自己的学习与感悟，支持自定义标签，数据通过 GitHub Gist 多端同步。

<ClientOnly>
  <StudyLog />
</ClientOnly>

## 多端同步说明

数据默认存储在浏览器 `localStorage` 中。要做到多端（电脑、手机等）都能看到，需要配置 **GitHub Gist 同步**：

1. 打开页面下方的「管理」→「多设备同步」
2. 点击 [创建 Token](https://github.com/settings/tokens/new?scopes=gist&description=Journal+Sync) 链接，在 GitHub 生成一个 Personal Access Token（勾选 `gist` 权限）
3. 将 Token 粘贴到输入框，点击「连接」
4. 以后每次保存记录，会自动同步到 GitHub Gist；在其他设备上同样的步骤连接同一个 Token 即可拉取数据

> 如需离线备份，也可用管理区的「导出 / 导入」功能。
