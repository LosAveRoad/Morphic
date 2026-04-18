# Cognitive Lab Agent APIs Backend

基于Node.js + TypeScript + Express的AI Agent API服务，为Cognitive Lab提供智能交互功能。

## 功能特性

- ✅ **推荐选项API** - AI根据上下文推荐交互选项
- ✅ **内容生成API** - 根据用户选择生成高质量内容
- ✅ **顺序流程** - 推荐→生成的两步交互Pipeline
- ✅ **结构化输出** - 强制JSON格式，确保前端正确解析

## 技术栈

- Node.js 18+
- Express.js + TypeScript
- DeepSeek API
- Jest + Supertest

## 快速开始

### 环境准备

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的 DeepSeek API Key
```

### 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 运行测试

```bash
npm test
```

## 项目结构

```
src/
├── agents/       # Agent实现
├── api/         # API路由和控制器
├── services/    # 服务层
├── types/       # TypeScript类型
├── utils/       # 工具函数
└── config/      # 配置管理
```

## 许可证

MIT License
