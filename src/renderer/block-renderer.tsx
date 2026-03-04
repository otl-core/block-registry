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

let globalAnalyticsWrapper: AnalyticsWrapperComponent | null = null;

/**
 * Register a global analytics wrapper component that will be applied to
 * all blocks rendered by BlockRenderer. Call once during app initialization.
 */
export function registerAnalyticsWrapper(
  wrapper: AnalyticsWrapperComponent,
): void {
  globalAnalyticsWrapper = wrapper;
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

// NO "use client" directive - this is a server component
export default function BlockRenderer({
  block,
  blockRegistry,
  siteId,
  analyticsWrapper,
}: BlockRendererProps) {
  const AnalyticsWrapper = analyticsWrapper ?? globalAnalyticsWrapper;
  const { type, id } = block;

  const BlockComponent = blockRegistry.get(type);

  if (!BlockComponent) {
    const config =
      "config" in block && block.config !== undefined
        ? block.config
        : "data" in block && block.data !== undefined
          ? block.data
          : {};

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
  const config =
    "config" in block && block.config !== undefined
      ? block.config
      : "data" in block && block.data !== undefined
        ? block.data
        : {};

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
      <BlockComponent
        config={config}
        siteId={siteId}
        blockRegistry={blockRegistry}
      />,
    );
  }

  return wrapWithAnalytics(<BlockComponent config={config} siteId={siteId} />);
}
