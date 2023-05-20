export const isPromise = <T>(value: unknown): value is Promise<T> =>
  typeof value === "object" &&
  value !== null &&
  (typeof value as unknown as { then?: unknown }).then === "function" &&
  (typeof value as unknown as { catch?: unknown }).catch === "function";

export const isPromiseLike = <T>(value: unknown): value is PromiseLike<T> =>
  typeof value === "object" && value !== null && (typeof value as unknown as { then?: unknown }).then === "function";
