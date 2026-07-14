import Redis from "ioredis";
import { env } from "./env";

/**
 * Shared ioredis client.
 *
 * Connection errors are handled gracefully: they are logged to stderr but
 * do not crash the process. Consumers should handle the case where Redis
 * is temporarily unavailable (e.g., treat cache misses as cold-cache).
 */
function createRedisClient(): Redis {
  const client = new Redis(env.REDIS_URL, {
    // Retry strategy: exponential backoff capped at 30 seconds, max 10 retries
    retryStrategy(times) {
      if (times > 10) {
        console.error("[Redis] Max reconnect attempts reached. Giving up.");
        return null; // Stop retrying
      }
      const delay = Math.min(times * 500, 30_000);
      return delay;
    },
    // Silence "maxRetriesPerRequest" warning for BullMQ compatibility
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });

  client.on("connect", () => {
    console.log("[Redis] Connected");
  });

  client.on("ready", () => {
    console.log("[Redis] Ready");
  });

  client.on("error", (err: Error) => {
    // Log but do not throw — allow the app to continue with degraded functionality
    console.error("[Redis] Connection error:", err.message);
  });

  client.on("close", () => {
    console.warn("[Redis] Connection closed");
  });

  client.on("reconnecting", () => {
    console.log("[Redis] Reconnecting…");
  });

  return client;
}

export const redis = createRedisClient();
