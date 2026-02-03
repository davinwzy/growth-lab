# 项目开发完整指南

从零开始用 AI + Vibe Coding 打造一个完整的 Web 应用。

本文档记录「班级管理系统」的完整开发过程，可作为未来项目的参考模板。

---

## 目录

1. [前期准备](#1-前期准备)
2. [项目初始化](#2-项目初始化)
3. [核心功能开发](#3-核心功能开发)
4. [测试与调试](#4-测试与调试)
5. [部署上线](#5-部署上线)
6. [维护与更新](#6-维护与更新)
7. [经验总结](#7-经验总结)

---

## 1. 前期准备

### 1.1 明确需求

在开始写代码之前，先想清楚：

**为什么要做这个？（Why）**
> 我的学生内驱力很低，想用游戏化的方式激励他们。

**要解决什么问题？（What）**
> - 出勤记录麻烦
> - 加分扣分没有系统
> - 缺乏激励机制

**核心功能是什么？（How）**
> - 学生管理
> - 加分/扣分
> - 出勤签到
> - 游戏化（等级、徽章）

### 1.2 技术选型

| 需求 | 选择 | 原因 |
|------|------|------|
| 前端框架 | React | 生态成熟，AI 辅助友好 |
| 类型检查 | TypeScript | 减少 bug，代码更健壮 |
| 构建工具 | Vite | 快速，配置简单 |
| 样式方案 | Tailwind CSS | 快速开发，无需写 CSS 文件 |
| 数据存储 | localStorage | 简单，无需后端 |
| 部署平台 | GitHub Pages | 免费，自动部署 |

### 1.3 环境准备

确保你的电脑已安装：

```bash
# 检查 Node.js（需要 18+）
node --version

# 检查 npm
npm --version

# 检查 Git
git --version
```

---

## 2. 项目初始化

### 2.1 创建项目

```bash
# 使用 Vite 创建 React + TypeScript 项目
npm create vite@latest my-project -- --template react-ts

# 进入项目
cd my-project

# 安装依赖
npm install
```

### 2.2 安装额外依赖

```bash
# Tailwind CSS
npm install tailwindcss @tailwindcss/vite
```

### 2.3 配置 Tailwind

在 `vite.config.ts` 中添加：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/your-project-name/',  // GitHub Pages 需要
})
```

在 `src/index.css` 中添加：

```css
@import "tailwindcss";
```

### 2.4 项目结构

```
src/
├── components/          # 组件
│   ├── common/         # 通用组件（Button, Modal）
│   ├── student/        # 学生相关组件
│   ├── group/          # 分组相关组件
│   └── ...
├── contexts/           # React Context（状态管理）
├── hooks/              # 自定义 Hooks
├── types/              # TypeScript 类型定义
├── utils/              # 工具函数
├── App.tsx             # 主应用
├── main.tsx            # 入口文件
└── index.css           # 全局样式
```

### 2.5 启动开发

```bash
npm run dev
```

浏览器打开 http://localhost:5173/

---

## 3. 核心功能开发

### 3.1 开发顺序

按照依赖关系，从底层到上层开发：

```
1. 类型定义 (types/)
   ↓
2. 工具函数 (utils/)
   ↓
3. 状态管理 (contexts/)
   ↓
4. 通用组件 (components/common/)
   ↓
5. 业务组件 (components/*)
   ↓
6. 页面整合 (App.tsx)
```

### 3.2 类型定义优先

先定义好数据结构，后续开发会更顺畅：

```typescript
// src/types/index.ts

// 学生
export interface Student {
  id: string;
  classId: string;
  groupId: string;
  name: string;
  score: number;
  avatar?: string;
}

// 班级
export interface Class {
  id: string;
  name: string;
  createdAt: number;
}

// 分组
export interface Group {
  id: string;
  classId: string;
  name: string;
  color: string;
  order: number;
}
```

### 3.3 状态管理

使用 React Context + useReducer：

```typescript
// src/contexts/AppContext.tsx

interface AppState {
  classes: Class[];
  students: Student[];
  groups: Group[];
  currentClassId: string | null;
  // ...
}

type AppAction =
  | { type: 'ADD_STUDENT'; payload: Student }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'DELETE_STUDENT'; payload: string }
  // ...

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_STUDENT':
      return { ...state, students: [...state.students, action.payload] };
    // ...
  }
}
```

### 3.4 数据持久化

使用 localStorage 自动保存：

```typescript
// 保存到 localStorage
useEffect(() => {
  localStorage.setItem('app-data', JSON.stringify(state));
}, [state]);

// 从 localStorage 读取
const loadInitialState = (): AppState => {
  const saved = localStorage.getItem('app-data');
  if (saved) {
    return JSON.parse(saved);
  }
  return defaultState;
};
```

### 3.5 功能模块开发

每个功能按这个流程开发：

```
1. 定义类型 → 2. 添加到 State → 3. 写 Reducer → 4. 做 UI 组件 → 5. 测试
```

**示例：添加出勤功能**

```
1. 定义 AttendanceRecord 类型
2. 在 AppState 添加 attendanceRecords: AttendanceRecord[]
3. 写 ADD_ATTENDANCE, DELETE_ATTENDANCE reducer
4. 做 AttendanceModal 组件
5. 测试签到、补签、撤销功能
```

### 3.6 与 AI 协作的技巧

**描述需求时要具体：**

❌ 不好：「帮我做一个出勤功能」

✅ 好：「帮我做一个出勤功能，需要：
- 日历视图，可以选择日期
- 支持补签（过去的日期）
- 支持撤销（取消错误的签到）
- 签到要加 1 分
- 与现有的加分系统整合」

**分步骤开发：**

不要一次要求太多功能，分步骤来：
1. 先做基础签到
2. 再加日历视图
3. 再加补签功能
4. 最后加撤销功能

**遇到 bug 时：**

把错误信息完整贴给 AI，说明：
- 做了什么操作
- 期望的结果
- 实际的结果

---

## 4. 测试与调试

### 4.1 开发时测试

```bash
# 启动开发服务器
npm run dev

# 在浏览器测试功能
```

### 4.2 构建测试

```bash
# 构建生产版本
npm run build

# 如果有 TypeScript 错误会在这里显示
```

### 4.3 常见问题

| 问题 | 解决方案 |
|------|---------|
| 类型错误 | 检查 TypeScript 类型定义 |
| 数据不保存 | 检查 localStorage 逻辑 |
| 样式不生效 | 检查 Tailwind 配置 |
| 页面空白 | 打开浏览器控制台看错误 |

---

## 5. 部署上线

### 5.1 GitHub 仓库设置

```bash
# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit"
```

### 5.2 SSH Key 设置（首次需要）

```bash
# 生成 SSH Key
ssh-keygen -t ed25519 -C "your-email@example.com"

# 复制公钥
cat ~/.ssh/id_ed25519.pub

# 添加到 GitHub: https://github.com/settings/keys
```

### 5.3 推送到 GitHub

```bash
# 在 GitHub 创建仓库后
git remote add origin git@github.com:username/repo-name.git
git push -u origin main
```

### 5.4 配置 GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: ['main']
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 5.5 启用 GitHub Pages

1. 进入仓库 Settings → Pages
2. Source 选择 **GitHub Actions**
3. 保存

### 5.6 完成部署

推送代码后，GitHub Actions 会自动构建和部署：

```bash
git add .
git commit -m "Add feature"
git push
```

网站地址：`https://username.github.io/repo-name/`

---

## 6. 维护与更新

### 6.1 更新流程

```bash
# 1. 修改代码
# 2. 本地测试
npm run dev

# 3. 构建测试
npm run build

# 4. 提交并推送
git add .
git commit -m "描述你的更改"
git push

# 5. 等待 GitHub Actions 自动部署（1-2分钟）
```

### 6.2 本地快捷启动

创建 `启动项目.command` 文件：

```bash
#!/bin/bash
cd ~/Desktop/your-project
echo "🚀 正在启动..."
npm run dev
```

然后：
```bash
chmod +x 启动项目.command
```

双击即可启动。

### 6.3 数据备份

提醒用户定期使用「导出数据」功能备份。

---

## 7. 经验总结

### 7.1 做对的事情

✅ **先想清楚再动手**
- 明确要解决的问题
- 列出核心功能
- 确定技术方案

✅ **类型定义优先**
- 先定义好数据结构
- TypeScript 帮你避免很多 bug

✅ **分步骤开发**
- 不要一次做太多
- 每完成一个功能就测试

✅ **善用 AI 辅助**
- 描述需求要具体
- 遇到问题把错误信息贴全
- 让 AI 解释不懂的代码

### 7.2 可以改进的地方

⚠️ **早点设置版本控制**
- 一开始就用 Git
- 每完成一个功能就提交

⚠️ **考虑数据迁移**
- 如果改变数据结构，要兼容旧数据

⚠️ **写注释和文档**
- 方便以后维护
- 方便他人理解

### 7.3 项目清单模板

未来开发新项目时，可以按这个清单进行：

```markdown
## 项目启动清单

### 前期
- [ ] 明确项目目标和要解决的问题
- [ ] 列出核心功能（MVP）
- [ ] 确定技术栈
- [ ] 准备开发环境

### 开发
- [ ] 初始化项目
- [ ] 配置 Tailwind CSS
- [ ] 定义类型（types/）
- [ ] 设置状态管理（Context）
- [ ] 实现数据持久化（localStorage）
- [ ] 开发通用组件
- [ ] 开发业务功能
- [ ] 添加多语言支持（可选）

### 部署
- [ ] 设置 Git 仓库
- [ ] 配置 SSH Key
- [ ] 创建 GitHub Actions
- [ ] 启用 GitHub Pages
- [ ] 测试线上版本

### 完善
- [ ] 写 README
- [ ] 写 ROADMAP
- [ ] 创建本地启动快捷方式
- [ ] 分享给用户
```

---

## 附录

### A. 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本

# Git
git status           # 查看状态
git add .            # 添加所有文件
git commit -m "msg"  # 提交
git push             # 推送

# SSH
eval "$(ssh-agent -s)"       # 启动 SSH agent
ssh-add ~/.ssh/id_ed25519    # 添加密钥
```

### B. 有用的资源

- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vite 文档](https://vite.dev/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

### C. 项目文件结构参考

```
project/
├── .github/
│   └── workflows/
│       └── deploy.yml      # 自动部署配置
├── public/                  # 静态资源
├── src/
│   ├── components/         # 组件
│   ├── contexts/           # 状态管理
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # 类型定义
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 主应用
│   ├── main.tsx            # 入口
│   └── index.css           # 样式
├── .gitignore
├── index.html
├── package.json
├── README.md
├── ROADMAP.md
├── PROJECT_GUIDE.md        # 本文档
├── tsconfig.json
└── vite.config.ts
```

---

**祝你下一个项目顺利！** 🚀
