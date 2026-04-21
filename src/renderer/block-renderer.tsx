/**
 * Block Renderer
 * Dynamically renders block components based on schema instance type
 *
 * SSR COMPATIBLE: This is a pure server component with no client hooks.
 * Analytics wrapper is a client component that is rendered by this server
 * component (valid in Next.js RSC architecture).
 */

import { BlockRegistry } from "../registry/block-registry";
import ComponentNotFound from "./component-not-found";

interface BlockAnalyticsConfig {
  enabled: boolean;
  event_label: string;
  track_type: "click" | "visibility" | "both";
  visibility_threshold?: number;
  fire_once?: boolean;
  target_providers?: "all" | string[];
  custom_params?: Record<string, string>;
}

type AnalyticsWrapperComponent = React.ComponentType<{
  analyticsConfig: BlockAnalyticsConfig | undefined;
  blockId: string;
  blockType: string;
  children: React.ReactNode;
}>;

type BlockStyleWrapperComponent = React.ComponentType<{
  config: Record<string, unknown>;
  children: React.ReactNode;
}>;

let globalAnalyticsWrapper: AnalyticsWrapperComponent | null = null;
let globalBlockStyleWrapper: BlockStyleWrapperComponent | null = null;

/**
 * Register a global analytics wrapper component that will be applied to
 * all blocks rendered by BlockRenderer. Call once during app initialization.
 */
export function registerAnalyticsWrapper(
  wrapper: AnalyticsWrapperComponent,
): void {
  globalAnalyticsWrapper = wrapper;
}

/**
 * Register a global block style wrapper component that applies common
 * styling (padding, margin, color, borderRadius, etc.) to all blocks.
 * Call once during app initialization.
 */
export function registerBlockStyleWrapper(
  wrapper: BlockStyleWrapperComponent,
): void {
  globalBlockStyleWrapper = wrapper;
}

interface BlockInstance {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  data?: Record<string, unknown>;
}

interface BlockRendererProps {
  block: BlockInstance;
  blockRegistry: BlockRegistry;
  siteId?: string;
  /** Optional wrapper component for block-level analytics (overrides global) */
  analyticsWrapper?: AnalyticsWrapperComponent;
}

function resolveBlockConfig(block: BlockInstance): Record<string, unknown> {
  if ("config" in block && block.config !== undefined) {
    return block.config;
  }
  if ("data" in block && block.data !== undefined) {
    return block.data;
  }
  return {};
}

// NO "use client" directive - this is a server component
export default function BlockRenderer({
  block,
  blockRegistry,
  siteId,
  analyticsWrapper,
}: BlockRendererProps) {
  const AnalyticsWrapper = analyticsWrapper ?? globalAnalyticsWrapper;
  const { type, id } = block;

  // eslint-disable-next-line react-hooks/static-components -- dynamic registry lookup by design
  const BlockComponent = blockRegistry.get(type);

  if (!BlockComponent) {
    const config = resolveBlockConfig(block);

    return (
      <ComponentNotFound
        type={type}
        config={config}
        availableTypes={blockRegistry.getAll()}
        componentKind="block"
      />
    );
  }

  // Extract analytics config from the block config
  const blockAnalytics = block.config?.analytics as
    | BlockAnalyticsConfig
    | undefined;

  const StyleWrapper = globalBlockStyleWrapper;

  // Helper to wrap rendered block with analytics if wrapper is provided
  const wrapWithAnalytics = (element: React.ReactElement) => {
    if (AnalyticsWrapper) {
      return (
        <AnalyticsWrapper
          analyticsConfig={blockAnalytics}
          blockId={id}
          blockType={type}
        >
          {element}
        </AnalyticsWrapper>
      );
    }
    return element;
  };

  // Form blocks get blockId, siteId, and their embedded data
  if (type.startsWith("form-")) {
    return wrapWithAnalytics(<BlockComponent blockId={id} siteId={siteId} />);
  }

  // Special handling for the "form" block (embedded form)
  // This block type receives both config AND data
  if (type === "form") {
    const config = block.config || {};
    const data = block.data; // This contains FormBlockData from backend
    return wrapWithAnalytics(
      <BlockComponent config={config} data={data} siteId={siteId} />,
    );
  }

  // Regular blocks get config (or data if config is not present)
  const config = resolveBlockConfig(block);

  // Helper to wrap rendered block with style wrapper if registered
  const wrapWithStyle = (element: React.ReactElement) => {
    if (StyleWrapper) {
      return <StyleWrapper config={config}>{element}</StyleWrapper>;
    }
    return element;
  };

  // Blocks that can contain nested blocks need the blockRegistry and siteId
  if (
    type === "alert" ||
    type === "card" ||
    type === "modal" ||
    type === "grid-layout" ||
    type === "flexbox-layout" ||
    type === "container-layout" ||
    type === "entry-content"
  ) {
    return wrapWithAnalytics(
      wrapWithStyle(
        <BlockComponent
          config={config}
          siteId={siteId}
          blockRegistry={blockRegistry}
        />,
      ),
    );
  }

  return wrapWithAnalytics(
    wrapWithStyle(<BlockComponent config={config} siteId={siteId} />),
  );
}
