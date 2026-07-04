# AI Prompt Modular Optimizer

一个本地运行的 Prompt 模块化组合优化工具。用户输入原始需求后，可以主动选择 AIM 提问法、需求控制、真实性保证、输出标准、迭代修正等模块，实时生成 Draft Prompt，并通过后端代理调用 DeepSeek 进行结构化优化。

## 功能

- 原始需求、背景、目标、限制条件输入
- Prompt 模块开关与子选项配置
- AIM 模块 AI 一键补齐，生成多套可编辑方案
- AIM 字段支持展开编辑
- 实时 Draft Prompt 预览
- DeepSeek 后端代理优化
- 最终 Prompt 复制、编辑、导出 Markdown / TXT
- 常用场景保存、命名、重命名、套用、删除
- 历史记录搜索、复制、编辑、删除


## 环境要求

- Windows
- Node.js 18+
- DeepSeek API Key，只有使用 AI 优化功能时需要

## 快速启动

### Windows 双击启动

1. 安装 [Node.js 18+] windows管理员模式下命令行直接如输入：winget install OpenJS.NodeJS.18
2. 克隆或下载本项目
3. 目前项目仅支持使用 DeepSeek，双击 `配置API密钥.bat`，按提示输入自己的 API Key
4. 双击 `启动软件.bat`

## 环境变量

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TEMPERATURE=0.4
DEEPSEEK_MAX_TOKENS=2400
PORT=5177
```

## 项目结构

```text
.
├── public/
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── server.js
├── package.json
├── .env.example
├── .gitignore
├── configure-api-key.bat
├── configure-api-key.ps1
├── start-app.bat
└── start-app.ps1
```

## API Key 处理方式

- 前端不保存、不显示、不直接调用 DeepSeek API
- 后端只从 `.env` 或系统环境变量读取 `DEEPSEEK_API_KEY`
- `/api/optimize` 和 `/api/suggest-aim` 都通过本地后端代理调用 DeepSeek

## License

未指定许可证。公开仓库前请根据你的发布意图添加合适的开源许可证。
