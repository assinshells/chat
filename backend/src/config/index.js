// backend/src/config/index.js

import { getEnvConfig } from "./env.config.js";

const envConfig = getEnvConfig();

export const config = {
  env: envConfig.NODE_ENV,
  port: envConfig.PORT,

  database: {
    uri: envConfig.MONGODB_URI,
    options: {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    },
  },

  cors: {
    origin: envConfig.CORS_ORIGIN,
    credentials: true,
  },

  logger: {
    level: envConfig.LOG_LEVEL,
    prettyPrint: envConfig.NODE_ENV === "development",
  },
};
