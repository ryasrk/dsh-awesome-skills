/** Minimal surface of schemastery this package uses. */
declare function z<T extends Record<string, unknown>>(
  schema: T,
): z.Schema<{ [K in keyof T]: T[K] extends { __default: infer D } ? D : unknown }>
declare namespace z {
  interface Schema<T = unknown> {
    (value: unknown): T
    toJSON(): unknown
    default(value: T): Schema<T>
    describe(text: string): Schema<T>
  }
  function boolean(): Schema<boolean>
  function number(): Schema<number>
  function string(): Schema<string>
}
export = z
