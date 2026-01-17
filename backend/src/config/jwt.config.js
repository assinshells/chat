// backend/src/config/jwt.config.js

import { getEnvConfig } from "./env.config.js";

const envConfig = getEnvConfig();

export const jwtConfig = {
  access: {
    secret: envConfig.JWT_SECRET,
    expiresIn: "15m",
  },
  refresh: {
    expiresIn: 7 * 24 * 60 * 60 * 1000,
  },
};

export const cookieConfig = {
  httpOnly: true,
  secure: envConfig.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const COOKIE_NAMES = {
  REFRESH_TOKEN: "refreshToken",
  ACCESS_TOKEN: "accessToken",
};
