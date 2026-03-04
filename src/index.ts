/**
 * @otl-core/block-registry
 * Block registry infrastructure for OTL CMS
 */

export { BlockRegistry } from "./registry/block-registry";
export type {
  BlockComponent,
  BlockComponentProps,
  FormBlockComponentProps,
} from "./registry/types";
export {
  default as BlockRenderer,
  registerAnalyticsWrapper,
} from "./renderer/block-renderer";
export { default as ComponentNotFound } from "./renderer/component-not-found";
