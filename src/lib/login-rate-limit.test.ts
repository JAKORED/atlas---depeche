import { beforeEach, describe, expect, it } from "vitest";
import {
  checkLoginRateLimit,
  clearLoginRateLimits,
  recordLoginFailure,
  resetLoginRateLimit,
} from "./login-rate-limit";

const T0 = 1_000_000;

beforeEach(() => {
  clearLoginRateLimits();
});

describe("login rate limit", () => {
  it("allows attempts while under the threshold", () => {
    for (let i = 0; i < 4; i++) {
      expect(checkLoginRateLimit("1.2.3.4", T0).allowed).toBe(true);
      recordLoginFailure("1.2.3.4", T0);
    }
  });

  it("blocks the sixth attempt in the window", () => {
    for (let i = 0; i < 5; i++) {
      recordLoginFailure("1.2.3.4", T0);
    }
    const result = checkLoginRateLimit("1.2.3.4", T0 + 1_000);
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("isolates counters per client key", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4", T0);
    expect(checkLoginRateLimit("1.2.3.4", T0).allowed).toBe(false);
    expect(checkLoginRateLimit("5.6.7.8", T0).allowed).toBe(true);
  });

  it("resets after a successful login", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4", T0);
    resetLoginRateLimit("1.2.3.4");
    expect(checkLoginRateLimit("1.2.3.4", T0).allowed).toBe(true);
  });

  it("allows again once the window has elapsed", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4", T0);
    const later = T0 + 15 * 60 * 1000 + 1;
    expect(checkLoginRateLimit("1.2.3.4", later).allowed).toBe(true);
  });
});
