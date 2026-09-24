declare module '@deepseek-ai/cordis' {
  export interface Context {
    on(event: string, handler: (...args: never[]) => unknown): () => void
    effect(factory: () => unknown, label?: string): void
  }
}

declare module '@deepseek-ai/dsh-client-locale/client' {}
declare module '@deepseek-ai/dsh-client-ui-theme/client' {}
