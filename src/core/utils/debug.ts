import debug from "debug";

export const DEBUG_NAMESPACE = "deck-gl";

/**
 * @internal
 */
export function createDebug(componentName: string) {
  return debug(`${DEBUG_NAMESPACE}:${componentName}`);
}
