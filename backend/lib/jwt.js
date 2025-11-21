import jwt from "jsonwebtoken";

const secret = (process.env.JWT_SECRET || "").trim();

if (!secret) {
  throw new Error("JWT_SECRET is not configured. Set a strong secret in backend/.env");
}

const defaultExpiresIn = process.env.JWT_EXPIRES_IN || "7d";

export function getJwtSecret() {
  return secret;
}

export function signJwt(payload, options = {}) {
  const expiresIn = options.expiresIn || defaultExpiresIn;
  return jwt.sign(payload, secret, { ...options, expiresIn });
}

export function verifyJwt(token) {
  return jwt.verify(token, secret);
}
