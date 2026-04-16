/**
 * Minimal type stub for posthog-js.
 * Only used when the package is NOT installed — the dynamic import
 * in src/lib/analytics.ts catches the missing module at runtime.
 * Once posthog-js is added via npm, this file can be deleted.
 */
declare module 'posthog-js' {
  interface PostHog {
    init(apiKey: string, options?: Record<string, unknown>): void;
    capture(event: string, properties?: Record<string, unknown>): void;
    identify(userId: string, traits?: Record<string, unknown>): void;
    reset(): void;
  }
  const posthog: PostHog;
  export default posthog;
}
