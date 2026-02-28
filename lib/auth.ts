import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { getDb } from './db';
import type { User } from './db';

const jwtSecretString = process.env.JWT_SECRET || 'orbital-collision-monitor-dev-secret-key-2026';
const JWT_SECRET = new TextEncoder().encode(jwtSecretString);

export interface SessionUser {
  id: number;
  email: string;
  name: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.user as SessionUser;
  } catch {
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = getDb();
  const users = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1
  `;
  return (users[0] as User) || null;
}

export async function createUser(
  email: string,
  password: string,
  name?: string
): Promise<User> {
  const sql = getDb();
  const passwordHash = await hashPassword(password);
  
  const users = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name || null})
    RETURNING *
  `;
  return users[0] as User;
}

export async function updateLastLogin(userId: number): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = ${userId}
  `;
}

export async function getSession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  return verifyToken(token);
}
