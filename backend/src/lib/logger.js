// backend/src/lib/logger.js

import pino from "pino";
import { getEnvConfig } from "../config/env.config.js";

const envConfig = getEnvConfig();

const pinoConfig = {
  level: envConfig.LOG_LEVEL,

  ...(envConfig.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        singleLine: false,
      },
    },
  }),

  base: {
    env: envConfig.NODE_ENV,
  },

  timestamp: () => `,"time":"${new Date().toISOString()}"`,

  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        userAgent: req.headers["user-agent"],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
};

export const logger = pino(pinoConfig);
