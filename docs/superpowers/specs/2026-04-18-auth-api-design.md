# Authentication API Design Spec

**版本**: 1.0.0
**日期**: 2026-04-18
**作者**: Claude Sonnet
**状态**: 设计阶段

---

## 概述

本文档定义了 Cognitive Lab 后端认证 API 的设计规范，提供用户注册、登录和身份验证功能。

### 功能范围

**包含**:
- ✅ 用户注册 (Email + Password + 可选 Username)
- ✅ 用户登录
- ✅ 获取当前用户信息
- ✅ JWT Token 认证
- ✅ 密码加密存储

**不包含** (暂不实现):
- ❌ 邮箱验证
- ❌ 密码找回
- ❌ 第三方登录
- ❌ 用户偏好设置 (预留字段)

---

## 技术栈

| 组件 | 技术 | 说明 |
|------|------|------|
| 数据库 | SQLite | 开发阶段，后期可迁移到 PostgreSQL |
| ORM | Prisma | 类型安全的数据库访问 |
| 认证 | JWT (jsonwebtoken) | Token-based authentication |
| 密码加密 | bcrypt | 10 salt rounds |
| 验证 | Joi | 请求参数验证 |

---

## 数据模型

### User 表

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  username     String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

### 字段说明

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PRIMARY KEY | 用户唯一标识符 |
| email | String | UNIQUE, NOT NULL | 用户邮箱，用于登录 |
| passwordHash | String | NOT NULL | bcrypt 加密后的密码 |
| username | String | OPTIONAL | 用户昵称 |
| createdAt | DateTime | DEFAULT(now()) | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

---

## API 端点

### 基础 URL

```
http://localhost:3000/api/auth
```

### 1. 用户注册

**端点**: `POST /api/auth/register`

**请求体**:
```typescript
interface RegisterRequest {
  email: string        // 必需，有效邮箱格式
  password: string     // 必需，最少 8 个字符
  username?: string    // 可选，3-50 个字符
}
```

**响应** (201 Created):
```typescript
interface RegisterResponse {
  user: {
    id: string
    email: string
    username?: string
    createdAt: string
  }
  token: string      // JWT token
}
```

**错误响应**:
```typescript
// 400 Bad Request - 验证失败
{
  error: "Validation Error",
  message: "Invalid input",
  details: [
    { field: "email", message: "Invalid email format" }
  ]
}

// 409 Conflict - 邮箱已存在
{
  error: "Conflict",
  message: "Email already exists"
}
```

---

### 2. 用户登录

**端点**: `POST /api/auth/login`

**请求体**:
```typescript
interface LoginRequest {
  email: string
  password: string
}
```

**响应** (200 OK):
```typescript
interface LoginResponse {
  user: {
    id: string
    email: string
    username?: string
    createdAt: string
  }
  token: string      // JWT token
}
```

**错误响应**:
```typescript
// 401 Unauthorized - 凭据无效
{
  error: "Unauthorized",
  message: "Invalid email or password"
}
```

---

### 3. 获取当前用户信息

**端点**: `GET /api/auth/me`

**请求头**:
```http
Authorization: Bearer {token}
```

**响应** (200 OK):
```typescript
interface MeResponse {
  user: {
    id: string
    email: string
    username?: string
    createdAt: string
    updatedAt: string
  }
}
```

**错误响应**:
```typescript
// 401 Unauthorized - Token 无效或过期
{
  error: "Unauthorized",
  message: "Invalid or expired token"
}
```

---

### 4. 用户登出 (可选)

**端点**: `POST /api/auth/logout`

**说明**: 客户端删除本地存储的 token 即可，此端点保留用于未来扩展 (如 token 黑名单)

**响应** (200 OK):
```typescript
interface LogoutResponse {
  message: "Logged out successfully"
}
```

---

## JWT Token 规范

### Token 结构

```typescript
interface JWTPayload {
  sub: string        // User ID
  email: string      // User email
  iat: number        // Issued at
  exp: number        // Expiration time (7 days)
}
```

### 配置

```env
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
```

### 使用示例

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 安全措施

### 密码要求
- 最小长度: 8 个字符
- 加密算法: bcrypt
- Salt rounds: 10

### 验证规则

**邮箱**:
- 必须符合标准邮箱格式
- 使用 Joi `string().email()` 验证

**密码**:
- 最少 8 个字符
- 最多 100 个字符

**用户名** (可选):
- 3-50 个字符
- 只允许字母、数字、下划线、连字符

### 错误处理

- ✅ 不泄露密码相关信息
- ✅ 不区分"邮箱不存在"和"密码错误" (统一返回 "Invalid email or password")
- ✅ 记录失败的登录尝试 (用于安全审计)

---

## 项目结构

```
src/
├── api/
│   ├── controllers/
│   │   └── auth-controller.ts       # 认证控制器
│   ├── routes/
│   │   └── auth.ts                   # 认证路由
│   └── middleware/
│       └── auth.ts                   # JWT 认证中间件
├── services/
│   └── auth-service.ts               # 认证业务逻辑
├── types/
│   └── auth.types.ts                 # 认证相关类型定义
├── utils/
│   └── password.ts                   # 密码加密工具
├── prisma/
│   └── schema.prisma                 # Prisma 数据模型
└── app.ts                            # 应用入口 (更新)
```

---

## 环境变量

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="auto-generated-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
```

---

## 实施清单

- [ ] 安装依赖 (Prisma, bcrypt, jsonwebtoken, @types/*)
- [ ] 配置 Prisma
- [ ] 创建数据库迁移
- [ ] 实现密码工具函数
- [ ] 实现 JWT 工具函数
- [ ] 实现认证服务层
- [ ] 实现认证控制器
- [ ] 实现认证中间件
- [ ] 创建认证路由
- [ ] 集成到主应用
- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 更新 API 文档

---

## 后续扩展 (Phase 2)

- 📧 邮箱验证
- 🔑 密码找回
- 👥 第三方登录 (Google, GitHub)
- ⚙️ 用户偏好设置
- 🔄 Token 刷新机制
- 📊 登录历史记录
- 🛡️ 两步验证 (2FA)

---

## 参考资料

- [Prisma Documentation](https://www.prisma.io/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
