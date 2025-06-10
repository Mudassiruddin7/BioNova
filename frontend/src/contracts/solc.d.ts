declare module 'solc' {
  function compile(input: string): string;
  // @ts-expect-error Unused export
  function loadRemoteVersion(version: string, callback: (err: Error | null, solc: Record<string, unknown>) => void): void;
  // @ts-expect-error Unused export
  function version(): string;
  export = compile;
} 