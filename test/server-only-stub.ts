// vitest runs outside Next's server/client bundler split, so the real
// "server-only" package's guard throws. Alias it to this no-op for tests.
export {};
