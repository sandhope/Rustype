# 代码质量指南

本文档描述了 Rustype 项目的代码质量检查和最佳实践。

## TypeScript 类型检查

### 基础类型检查（日常开发推荐）

```bash
npx tsc --noEmit
```

此命令检查所有 TypeScript 文件的类型错误，但不会生成输出文件。

### 严格模式检查（发现潜在问题）

```bash
npx tsc --noEmit --strict --noImplicitAny --noImplicitThis
```

严格模式有助于捕获潜在的空值/未定义问题，并强制执行更严格的类型检查。

### 检查特定目录

```bash
# PowerShell
npx tsc --noEmit 2>&1 | Select-String "src/muya/src"

# Bash/Git Bash
npx tsc --noEmit 2>&1 | grep "src/muya/src"
```

用于快速查找特定模块中的错误。

## 构建验证

```bash
npm run build
```

提交前始终运行完整构建，确保所有内容都能正确编译。

## VS Code 集成

- **查看所有错误**：按 `Ctrl+Shift+M` 打开"问题"面板
- **实时检查**：输入时错误会以红色波浪线显示
- **快速修复**：点击错误标记查看建议的修复方案

## 项目规范

### 不使用 ESLint/Prettier

本项目仅依赖 TypeScript 编译器进行代码质量检查：
- ❌ 无 ESLint 配置
- ❌ 无 Prettier 配置
- ✅ 使用 TypeScript 严格模式确保类型安全
- ✅ 手动遵循团队代码风格约定

### 为什么不使用额外工具？

1. **TypeScript 已足够**：TypeScript 编译器提供强大的类型检查
2. **简洁性**：工具越少，配置和维护成本越低
3. **团队偏好**：团队倾向于手动保持代码风格一致

## 最佳实践

### 1. 使用泛型实现类型安全的继承

当扩展带有自定义选项的类时，使用泛型而不是类型断言：

```typescript
// ✅ 推荐：泛型方式
abstract class BaseFloat<T extends IBaseOptions = IBaseOptions> {
    public options: T;
}

class LinkTools extends BaseFloat<ILinkToolsOptions> {
    someMethod() {
        this.options.jumpClick?.(...); // 类型安全访问
    }
}

// ❌ 避免：使用 getter 和类型断言
class LinkTools extends BaseFloat {
    private get _options(): ILinkToolsOptions {
        return this.options as ILinkToolsOptions;
    }
}
```

### 2. 正确处理 Nullable 类型

`Nullable<T>` 类型不应包含 `void`：

```typescript
// ✅ 正确的定义
export type Nullable<T> = T | null | undefined;

// ❌ 错误：void 会导致类型推断问题
export type Nullable<T> = T | null | undefined | void;
```

### 3. 访问属性前添加空值检查

```typescript
// ✅ 安全：检查 null/undefined
if (activeTab.file) {
    const fileDir = await dirname(activeTab.file.path);
}

// ❌ 不安全：可能导致运行时错误
const fileDir = await dirname(activeTab.file.path);
```

### 4. 为可选属性提供默认值

```typescript
// ✅ 安全：提供默认值
contentLength = event.data.contentLength ?? 0;

// ❌ 有风险：可能为 undefined
contentLength = event.data.contentLength;
```

## 常见类型问题及解决方案

### 问题：类型 'Y' 上不存在属性 'X'

**原因**：缺少类型声明或导入不正确

**解决方案**：
- 检查类型是否在 `.d.ts` 文件中导出
- 验证导入路径是否正确
- 运行 `npx tsc --noEmit` 查看详细错误信息

### 问题：类型 'null' 不能分配给类型 'X'

**原因**：未正确处理可空类型

**解决方案**：
- 访问属性前添加空值检查
- 适当时使用可选链（`?.`）
- 使用空值合并运算符（`??`）提供默认值

### 问题：找不到名称 'process'

**原因**：缺少 Node.js 类型定义

**解决方案**：
```bash
npm install --save-dev @types/node
```

然后在 `tsconfig.json` 的 types 字段中添加 `"node"`：
```json
{
  "compilerOptions": {
    "types": ["vite/client", "node"]
  }
}
```

## 工作流程建议

### 提交前

1. 运行类型检查：`npx tsc --noEmit`
2. 运行构建：`npm run build`
3. 修复发现的所有错误

### 定期检查

1. 运行严格模式：`npx tsc --noEmit --strict`
2. 审查并修复任何新警告
3. 更新代码以遵循最佳实践

### 添加新功能时

1. 从一开始就使用正确的类型编写 TypeScript
2. 除非绝对必要，否则避免使用 `any` 类型
3. 在启用严格模式下测试
4. 记录任何与类型相关的决策

## 故障排除

### TypeScript 服务器无响应

在 VS Code 中：
1. 打开命令面板（`Ctrl+Shift+P`）
2. 运行 "TypeScript: Restart TS Server"

### VS Code 中不显示错误

1. 检查 `tsconfig.json` 是否包含你的文件
2. 验证文件扩展名是 `.ts` 或 `.tsx`
3. 重启 VS Code TypeScript 服务器

### 构建成功但出现运行时错误

TypeScript 仅在编译时检查类型。以下情况仍可能导致运行时错误：
- 逻辑错误
- API 调用失败
- 异步操作失败
- 资源加载问题

构建后务必手动测试你的更改。

## 常见问题解答

### Q: 为什么项目不使用 ESLint？

A: TypeScript 编译器已经提供了强大的类型检查能力，对于这个项目来说已经足够。添加 ESLint 会增加配置复杂性和维护成本。

### Q: 什么时候应该使用严格模式检查？

A: 建议定期（例如每周或每次重大重构后）运行严格模式检查，以发现潜在的类型安全问题。

### Q: 如何处理第三方库的类型问题？

A: 
1. 首先检查是否有 `@types/xxx` 包可用
2. 如果没有，可以创建自己的类型声明文件
3. 作为最后手段，可以使用 `as any` 但要添加注释说明原因

### Q: `any` 类型什么时候可以使用？

A: 尽量避免使用 `any`。只有在以下情况下才考虑使用：
- 与没有类型定义的旧代码交互
- 处理动态内容且无法确定类型
- 临时解决方案，计划后续改进

使用时应添加注释说明为什么需要 `any`。
