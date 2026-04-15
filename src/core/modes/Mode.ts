import type { PickingInfo } from "@deck.gl/core";

/**
 * @internal
 */
export interface ModeEventMap<TFeature> {
  change: undefined;
  complete: TFeature;
}

/**
 * @internal
 */
export interface GeometryMode<TState, TStep extends string, TFeature> {
  handleClick(info: PickingInfo): boolean;
  handleHover(info: PickingInfo): boolean;
  reset(): void;
  getState(): TState;
  getStep(): TStep;
  getInstruction(): string;
  isActive(): boolean;
  on<E extends keyof ModeEventMap<TFeature>>(
    event: E,
    callback: (payload: ModeEventMap<TFeature>[E]) => void,
  ): () => void;
}

/**
 * @internal
 */
export class ModeEventEmitter<TFeature> {
  private changeListeners = new Set<() => void>();
  private completeListeners = new Set<(value: TFeature) => void>();

  on<E extends keyof ModeEventMap<TFeature>>(
    event: E,
    callback: (payload: ModeEventMap<TFeature>[E]) => void,
  ): () => void {
    if (event === "change") {
      const fn = callback as () => void;
      this.changeListeners.add(fn);
      return () => this.changeListeners.delete(fn);
    }
    const fn = callback as (value: TFeature) => void;
    this.completeListeners.add(fn);
    return () => this.completeListeners.delete(fn);
  }

  emitChange(): void {
    this.changeListeners.forEach((cb) => cb());
  }

  emitComplete(value: TFeature): void {
    this.completeListeners.forEach((cb) => cb(value));
  }
}
