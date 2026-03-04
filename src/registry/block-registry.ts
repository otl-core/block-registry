/**
 * Block Component Registry
 * Manages registration and retrieval of block components
 */

import { ComponentType } from "react";

export class BlockRegistry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private components = new Map<string, ComponentType<any>>();

  /**
   * Register a block component
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(type: string, component: ComponentType<any>): void {
    this.components.set(type, component);
  }

  /**
   * Get a block component by type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  get(type: string): ComponentType<any> | undefined {
    return this.components.get(type);
  }

  /**
   * Check if a block type is registered
   */
  has(type: string): boolean {
    return this.components.has(type);
  }

  /**
   * Get all registered block types
   */
  getAll(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Get count of registered components
   */
  size(): number {
    return this.components.size;
  }
}
