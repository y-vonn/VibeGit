# VibeGit Monorepo

(English below / 中文在下方)

## 结构 Structure
```
root
  frontend/  (React + Vite)
  backend/   (Express API)
  shared/    (共享类型与工具)
```

## 开发 Development
```bash
npm install
npm run dev   # 并行启动 backend(3000) + frontend(5173)
```
前端访问 http://localhost:5173 ，后端健康检查 http://localhost:3000/health

## 构建 Build
```bash
npm run build
```

## 后续计划 Next Steps
- 加入 ESLint / Prettier
- 单元测试（Vitest / Jest）
- Docker 化

---

# English
A simple fullstack starter using npm workspaces.

## Workspaces
- `frontend` React + Vite
- `backend` Express server
- `shared` Shared types & utils

## Scripts
- `npm run dev` parallel dev
- `npm run build` build all packages

Feel free to extend.
