export function logger(scope: string) {
  return {
    info: (...args: unknown[]) => console.log(`[${scope}]`, ...args),
    error: (...args: unknown[]) => console.error(`[${scope}]`, ...args)
  };
}
