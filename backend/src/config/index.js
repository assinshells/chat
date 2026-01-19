// backend/src/config/index.js

import { getEnvConfig } from "./env.config.js";

let cachedConfig = null;

export function getConfig() {
  if (!cachedConfig) {
    const env = getEnvConfig();

    cachedConfig = {
      env: env.NODE_ENV,
      port: env.PORT,

      database: {
        uri: env.MONGODB_URI,
        options: {
          maxPoolSize: 10,
          minPoolSize: 2,
          socketTimeoutMS: 45000,
          serverSelectionTimeoutMS: 5000,
        },
      },

      cors: {
        origin: env.CORS_ORIGIN,
        credentials: true,
      },

      logger: {
        level: env.LOG_LEVEL,
        prettyPrint: env.NODE_ENV === "development",
      },
    };
  }

  return cachedConfig;
}

export const config = new Proxy(
  {},
  {
    get(target, prop) {
      return getConfig()[prop];
    },
  },
);
