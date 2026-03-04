# @otl-core/block-registry

Block registry infrastructure for OTL CMS. This package provides the core registry and rendering
system for block components.

## Purpose

This package contains **ONLY infrastructure** - registry classes and renderers. Actual block
components (Markdown, Image, Video, etc.) remain in your application code for customization.

## SSR Compatibility

All components in this package are **server-component safe** and work with Next.js App Router SSR:

- No client-only hooks (useState, useEffect, useMemo, etc.)
- Pure synchronous logic
- Deterministic rendering

Individual block components in your app can be client components if they need interactivity - just
add `"use client"` at the top of those files.

## Installation

This package is part of the OTL CMS monorepo and uses workspace protocol:

```json
{
  "dependencies": {
    "@otl-core/block-registry": "workspace:*"
  }
}
```

## Usage

### 1. Create a Registry Instance

```typescript
// In your app: src/lib/registries/block-registry.ts
import { BlockRegistry } from "@otl-core/block-registry";
import Markdown from "@/components/blocks/markdown";
import Image from "@/components/blocks/image";
// ... import all your block components

export const blockRegistry = new BlockRegistry();

// Register your blocks
blockRegistry.register("markdown", Markdown);
blockRegistry.register("image", Image);
// ... register all blocks
```

### 2. Use BlockRenderer

```typescript
import { BlockRenderer } from '@otl-core/block-registry';
import { blockRegistry } from '@/lib/registries/block-registry';

export default function MyPage({ blocks }) {
  return (
    <div>
      {blocks.map((block) => (
        <BlockRenderer
          key={block.id}
          block={block}
          blockRegistry={blockRegistry}
          siteId="your-site-id"  // Optional, for form blocks
        />
      ))}
    </div>
  );
}
```

### 3. Form Block Support

Form blocks receive special props:

```typescript
// Your form block component
interface FormInputProps {
  blockId: string;
  siteId?: string;
}

export default function FormInput({ blockId, siteId }: FormInputProps) {
  // Your form block implementation
}

// Register it with type starting with "form-"
blockRegistry.register("form-input", FormInput);
```

The BlockRenderer automatically detects form blocks (types starting with `"form-"`) and passes
`blockId` and `siteId` instead of `config`.

## API Reference

### BlockRegistry

```typescript
class BlockRegistry<TProps> {
  register(type: string, component: ComponentType<TProps>): void;
  get(type: string): ComponentType<TProps> | undefined;
  has(type: string): boolean;
  getAll(): string[];
  size(): number;
}
```

### BlockRenderer Props

```typescript
interface BlockRendererProps {
  block: BlockInstance; // The block to render
  blockRegistry: BlockRegistry; // Registry containing block components
  siteId?: string; // Optional, for form blocks
}
```

### Block Component Props

Regular blocks receive:

```typescript
interface BlockComponentProps {
  config: Record<string, unknown>;
}
```

Form blocks receive:

```typescript
interface FormBlockComponentProps {
  blockId: string;
  siteId?: string;
}
```

## Error Handling

If a block type is not found in the registry, `ComponentNotFound` is rendered, which:

- Logs detailed error information in development
- Logs minimal error in production
- Calls global error handler if available (`window.__CMS_ERROR_HANDLER__`)
- Renders invisible placeholder to prevent layout breaks

## Best Practices

1. **Keep components in your app**: Don't put actual block components in this package
2. **Server-first**: Use server components by default, only add `"use client"` when needed
3. **Type safety**: Import types from this package for consistency
4. **Registry singleton**: Create one registry instance and export it
5. **Register all blocks**: Ensure all block types used in content are registered

## Examples

See `frontend/engine/examples/custom-block-example.tsx` for a complete example.
