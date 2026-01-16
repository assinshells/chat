// backend/src/config/jwt.config.js

import { envConfig } from "./env.config.js";

export const jwtConfig = {
  access: {
    secret: envConfig.JWT_SECRET,
    expiresIn: "15m",
  },
  refresh: {
    expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
};

export const cookieConfig = {
  httpOnly: true,
  secure: envConfig.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

// Cookie names
export const COOKIE_NAMES = {
  REFRESH_TOKEN: "refreshToken",
  ACCESS_TOKEN: "accessToken",
};
