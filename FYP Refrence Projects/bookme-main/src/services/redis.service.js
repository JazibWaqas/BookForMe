import { createClient } from "redis";

let client;

const redisService = {
  init: async () => {
    try {
      client = createClient({
        socket: {
          host: process.env.REDIS_HOST || "localhost",
          port: process.env.REDIS_PORT || 6379,
        },
      });
      client.on("error", (err) => console.log("[REDIS] Error:", err));
      await client.connect();
      console.log("[REDIS] Redis initialized");
    } catch (error) {
      console.log("[REDIS] Error during initialization");
      throw error;
    }
  },
  getClient: () => client,
};

export default redisService;
