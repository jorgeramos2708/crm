import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config.js';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, env.JWT_SECRET);
}

export function setAuthCookie(reply: any, token: string) {
  reply.setCookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.SESSION_TTL_SECONDS,
    path: '/',
  });
}

export function clearAuthCookie(reply: any) {
  reply.clearCookie('token', { path: '/' });
}