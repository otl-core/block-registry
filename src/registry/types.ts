/**
 * Type definitions for Block Registry
 */

import { ComponentType } from "react";

export interface BlockComponentProps<TConfig = Record<string, unknown>> {
  config: TConfig;
  siteId?: string;
}

export interface FormBlockComponentProps {
  blockId: string;
  siteId?: string;
}

export type BlockComponent =
  | ComponentType<BlockComponentProps>
  | ComponentType<FormBlockComponentProps>;
