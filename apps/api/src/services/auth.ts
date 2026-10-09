import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { FastifyReply, FastifyRequest } from "fastify";
import { env } from "../config.js";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

const SESSION_TTL_REMEMBER = 30 * 24 * 3600; // 30 días

export function sessionTtlSeconds(remember?: boolean): number {
  return remember ? SESSION_TTL_REMEMBER : env.SESSION_TTL_SECONDS;
}

export function generateToken(
  payload: object,
  expiresIn?: string | number,
): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: (expiresIn ??
      env.JWT_EXPIRES_IN) as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, env.JWT_SECRET);
}

export function setAuthCookie(reply: any, token: string, maxAge?: number) {
  const isProduction = process.env.NODE_ENV === "production";
  reply.setCookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: maxAge ?? env.SESSION_TTL_SECONDS,
    path: "/",
    // Explicitly set domain for localhost in development
    ...(!isProduction && { domain: "localhost" }),
  });
}

export function clearAuthCookie(reply: any) {
  reply.clearCookie("token", { path: "/" });
}
