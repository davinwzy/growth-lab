# 成长实验室 Growth Lab

一个为教师设计的游戏化班级管理工具，让课堂管理更轻松有趣。

🔗 **在线体验**: [https://davinwzy.github.io/growth-lab/](https://davinwzy.github.io/growth-lab/)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg)

---

## 为什么做这个？

2024年接手班主任，发现学生们内驱力很低，无论怎么鼓励激励，课堂表现总是不尽人意。

于是我想：**能不能设计一个游戏化的系统，让学习变得更有趣一点？**

这个系统就是这样诞生的。

---

## 功能特色

### 📋 班级管理
- 创建多个班级
- 管理学生名单
- 支持学生头像

### 👥 分组功能
- 学生分组管理
- 小组加分/扣分
- 随机重新分组

### ✅ 出勤签到
- 日历视图，一目了然
- 支持补签（补回过去的出勤）
- 支持撤销（取消错误的签到）
- 出勤统计与分析

### ➕ 加分 / 扣分
- 自定义加分项目
- 完整操作记录
- 支持批量操作

### 🎮 游戏化系统
- **等级系统**: 积累经验值升级
- **徽章收集**: 解锁各种成就徽章
- **连续签到**: 培养学生持续出勤的习惯
- **排行榜**: 激励良性竞争

### 🎁 奖励兑换
- 自定义奖励项目
- 学生用积分兑换
- 兑换记录追踪

### 🌐 其他
- 中文 / English 双语支持
- 数据导入 / 导出
- 完全离线可用
- 隐私安全（数据存在本地浏览器）

---

## 快速开始

### 在线使用（推荐）

直接访问：[https://davinwzy.github.io/growth-lab/](https://davinwzy.github.io/growth-lab/)

无需安装，打开即用！

### 本地运行

```bash
# 克隆项目
git clone https://github.com/davinwzy/growth-lab.git

# 进入目录
cd growth-lab

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

然后打开 http://localhost:5173/growth-lab/

---

## 技术栈

- **React 19** + **TypeScript**
- **Vite** - 构建工具
- **Tailwind CSS** - 样式
- **localStorage** - 本地数据存储
- **GitHub Actions** - 自动部署

---

## 项目结构

- `src/app` 全局状态与应用入口
- `src/features` 功能模块（班级、学生、出勤、奖励等）
- `src/shared` 通用组件与工具
- `src/styles` 全局样式与主题
- `public` 静态资源

---

## 常用脚本

- `npm run dev` 本地开发
- `npm run build` 生产构建
- `npm run preview` 预览构建结果
- `npm run lint` 代码规范检查
- `npm run test` 单元测试
- `npm run deploy` 部署到 GitHub Pages

---

## 数据与隐私

- 所有数据存储在**你的浏览器本地**
- 不会上传到任何服务器
- 建议定期使用「导出数据」功能备份
- 清理浏览器数据会导致本地记录丢失
- `STORAGE_KEY` 保持稳定以保护历史数据（修改需要迁移策略）

---

## Architecture

系统架构与数据流说明见：[ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 部署说明

- 默认通过 GitHub Actions 自动部署到 GitHub Pages
- 发布前可先执行 `npm run build` 进行本地验证
- `package.json` 中的 `homepage` 需与仓库 Pages 地址一致

---

## 贡献

欢迎提交 Issue 和 Pull Request！

如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！

---

## 作者

**Davin** - [davinmaking.substack.com](https://davinmaking.substack.com/)

Christian ✝ | Creator 🖥️ | Educator ✏️

---

## License

MIT License
