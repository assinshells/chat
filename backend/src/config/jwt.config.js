// backend/src/config/jwt.config.js

import { getEnvConfig } from "./env.config.js";

let cachedJwtConfig = null;
let cachedCookieConfig = null;

export function getJwtConfig() {
  if (!cachedJwtConfig) {
    const envConfig = getEnvConfig();

    cachedJwtConfig = {
      access: {
        secret: envConfig.JWT_SECRET,
        expiresIn: "15m",
      },
      refresh: {
        expiresIn: 7 * 24 * 60 * 60 * 1000,
      },
    };
  }

  return cachedJwtConfig;
}

export function getCookieConfig() {
  if (!cachedCookieConfig) {
    const envConfig = getEnvConfig();

    cachedCookieConfig = {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    };
  }

  return cachedCookieConfig;
}

export const jwtConfig = new Proxy(
  {},
  {
    get(target, prop) {
      return getJwtConfig()[prop];
    },
  },
);

export const cookieConfig = new Proxy(
  {},
  {
    get(target, prop) {
      return getCookieConfig()[prop];
    },
  },
);

export const COOKIE_NAMES = {
  REFRESH_TOKEN: "refreshToken",
  ACCESS_TOKEN: "accessToken",
};
