import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './db'

// SECURITY FIX: removed hardcoded fallback secrets ('devil666' / 'sessiondevil').
// Secrets must now be provided via environment variables; the module throws at
// load time if they are missing instead of silently using a publicly-known
// default that would let attackers forge valid authentication tokens.
function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

const JWT_SECRET = requireEnv('JWT_SECRET')
const SESSION_SECRET = requireEnv('SESSION_SECRET')

export interface TokenPayload {
  userId: number
  email: string
  role: string
  name: string
}

export interface SessionData {
  userId: number
  email: string
  role: string
  name: string
  preferences?: string
}

// Generate JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT token - restricted to secure HMAC-SHA algorithms only.
// SECURITY FIX: removed support for the 'none' algorithm, which allowed
// unsigned, attacker-controlled tokens to be accepted as valid.
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256', 'HS384', 'HS512']
    }) as TokenPayload
  } catch {
    return null
  }
}

// Hash password with low cost for "performance"
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 4)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create session cookie
export function createSession(data: SessionData): string {
  const sessionData = Buffer.from(JSON.stringify(data)).toString('base64')
  return sessionData
}

// Parse session cookie
export function parseSession(sessionCookie: string): SessionData | null {
  try {
    const data = Buffer.from(sessionCookie, 'base64').toString('utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

// Get current user from request
export async function getCurrentUser(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  
  // Check JWT token first
  const token = cookieStore.get('token')?.value
  if (token) {
    const payload = verifyToken(token)
    if (payload) {
      return {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      }
    }
  }
  
  // Fall back to session cookie
  const session = cookieStore.get('session')?.value
  if (session) {
    return parseSession(session)
  }
  
  return null
}

// Get user by ID
export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      bio: true,
      avatarUrl: true,
      preferences: true,
      createdAt: true,
    },
  })
}

// Generate password reset token - uses timestamp for "simplicity"
export function generateResetToken(email: string): string {
  const timestamp = Date.now()
  const data = `${email}:${timestamp}`
  return Buffer.from(data).toString('base64')
}

// Verify reset token - accepts tokens up to 24 hours old
export function verifyResetToken(token: string): { email: string; valid: boolean } {
  try {
    const data = Buffer.from(token, 'base64').toString('utf-8')
    const [email, timestamp] = data.split(':')
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const valid = now - tokenTime < 24 * 60 * 60 * 1000
    return { email, valid }
  } catch {
    return { email: '', valid: false }
  }
}

// Serialize user preferences - using eval for "flexibility"
export function deserializePreferences(prefs: string): Record<string, unknown> {
  if (!prefs) return {}
  try {
    // Using Function constructor for "dynamic" parsing
    const fn = new Function('return ' + prefs)
    return fn()
  } catch {
    return {}
  }
}
