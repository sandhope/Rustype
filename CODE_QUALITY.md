# Code Quality Guide

This document describes the code quality checks and best practices for the Rustype project.

## TypeScript Type Checking

### Basic Type Check (Recommended for Daily Development)

```bash
npx tsc --noEmit
```

This command checks all TypeScript files for type errors without generating output files.

### Strict Mode Check (Find Potential Issues)

```bash
npx tsc --noEmit --strict --noImplicitAny --noImplicitThis
```

Strict mode helps catch potential null/undefined issues and enforces stricter type checking.

### Check Specific Directory

```bash
# PowerShell
npx tsc --noEmit 2>&1 | Select-String "src/muya/src"

# Bash/Git Bash
npx tsc --noEmit 2>&1 | grep "src/muya/src"
```

Useful for quickly finding errors in specific modules.

## Build Verification

```bash
npm run build
```

Always run a full build before committing to ensure everything compiles correctly.

## VS Code Integration

- **View All Errors**: Press `Ctrl+Shift+M` to open the Problems panel
- **Real-time Checking**: Errors are displayed as you type with red squiggly lines
- **Quick Fixes**: Click on error markers for suggested fixes

## Project Standards

### No ESLint/Prettier

This project relies solely on the TypeScript compiler for code quality:
- ❌ No ESLint configuration
- ❌ No Prettier configuration
- ✅ TypeScript strict mode for type safety
- ✅ Manual code formatting following team conventions

### Why No Additional Tools?

1. **TypeScript is Sufficient**: The TypeScript compiler provides robust type checking
2. **Simplicity**: Fewer tools mean less configuration and maintenance
3. **Team Preference**: The team prefers manual code style consistency

## Best Practices

### 1. Use Generics for Type-Safe Inheritance

When extending classes with custom options, use generics instead of type assertions:

```typescript
// ✅ Recommended: Generic approach
abstract class BaseFloat<T extends IBaseOptions = IBaseOptions> {
    public options: T;
}

class LinkTools extends BaseFloat<ILinkToolsOptions> {
    someMethod() {
        this.options.jumpClick?.(...); // Type-safe access
    }
}

// ❌ Avoid: Type assertion with getter
class LinkTools extends BaseFloat {
    private get _options(): ILinkToolsOptions {
        return this.options as ILinkToolsOptions;
    }
}
```

### 2. Handle Nullable Types Properly

The `Nullable<T>` type should not include `void`:

```typescript
// ✅ Correct definition
export type Nullable<T> = T | null | undefined;

// ❌ Wrong: void causes type inference issues
export type Nullable<T> = T | null | undefined | void;
```

### 3. Add Null Checks Before Accessing Properties

```typescript
// ✅ Safe: Check for null/undefined
if (activeTab.file) {
    const fileDir = await dirname(activeTab.file.path);
}

// ❌ Unsafe: May cause runtime error
const fileDir = await dirname(activeTab.file.path);
```

### 4. Provide Default Values for Optional Properties

```typescript
// ✅ Safe: Provide default value
contentLength = event.data.contentLength ?? 0;

// ❌ Risky: May be undefined
contentLength = event.data.contentLength;
```

## Common Type Issues and Solutions

### Issue: Property 'X' does not exist on type 'Y'

**Cause**: Missing type declaration or incorrect import

**Solution**: 
- Check if the type is exported in `.d.ts` files
- Verify import paths are correct
- Run `npx tsc --noEmit` to see detailed error messages

### Issue: Type 'null' is not assignable to type 'X'

**Cause**: Not handling nullable types properly

**Solution**:
- Add null checks before accessing properties
- Use optional chaining (`?.`) when appropriate
- Provide default values with nullish coalescing (`??`)

### Issue: Cannot find name 'process'

**Cause**: Missing Node.js type definitions

**Solution**:
```bash
npm install --save-dev @types/node
```

Then add `"node"` to `tsconfig.json` types field:
```json
{
  "compilerOptions": {
    "types": ["vite/client", "node"]
  }
}
```

## Workflow Recommendations

### Before Committing

1. Run type check: `npx tsc --noEmit`
2. Run build: `npm run build`
3. Fix any errors found

### Periodic Checks

1. Run strict mode: `npx tsc --noEmit --strict`
2. Review and fix any new warnings
3. Update code to follow best practices

### When Adding New Features

1. Write TypeScript with proper types from the start
2. Avoid using `any` type unless absolutely necessary
3. Test with strict mode enabled
4. Document any type-related decisions

## Troubleshooting

### TypeScript Server Not Responding

In VS Code:
1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "TypeScript: Restart TS Server"

### Errors Not Showing in VS Code

1. Check if `tsconfig.json` includes your files
2. Verify file extensions are `.ts` or `.tsx`
3. Restart VS Code TypeScript server

### Build Succeeds but Runtime Errors Occur

TypeScript only checks types at compile time. Runtime errors may still occur due to:
- Logic errors
- API failures
- Async operation failures
- Resource loading issues

Always test your changes manually after building.
