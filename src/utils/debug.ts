import debug from "debug";

/**
 * Debug namespace for the orbit area components
 */
export const DEBUG_NAMESPACE = "orbit-area";

/**
 * Create a debug instance for a specific component or feature
 * @param componentName The name of the component or feature
 * @returns A debug instance
 *
 * Usage examples:
 * - const debug = createDebug('editor'); // creates orbit-area:editor
 * - const debug = createDebug('layer:events'); // creates orbit-area:layer:events
 */
export function createDebug(componentName: string) {
  return debug(`${DEBUG_NAMESPACE}:${componentName}`);
}

/**
 * Enable debugging for the orbit area components
 * Call this function to enable debug output in the browser console
 *
 * @param enable Whether to enable debugging (default: true)
 * @param namespaces Optional specific namespaces to enable, defaults to all orbit-area namespaces
 */
export function enableDebug(enable = false, namespaces?: string) {
  if (typeof localStorage !== "undefined") {
    const value = enable ? namespaces || `${DEBUG_NAMESPACE}:*` : "";

    localStorage.setItem("debug", value);

    // Log confirmation of debug state
    if (enable) {
      console.log(
        `Debugging enabled for ${namespaces || `${DEBUG_NAMESPACE}:*`}`
      );
    } else {
      console.log("Debugging disabled");
    }
  }
}

/**
 * Check if debugging is enabled for a specific namespace
 * @param namespace The namespace to check
 * @returns Whether debugging is enabled
 */
export function isDebugEnabled(namespace: string = DEBUG_NAMESPACE): boolean {
  if (typeof localStorage === "undefined") return false;

  const debugSetting = localStorage.getItem("debug");
  if (!debugSetting) return false;

  // Check if our namespace matches the debug setting
  if (debugSetting === "*" || debugSetting.includes(namespace)) {
    return true;
  }

  return false;
}
