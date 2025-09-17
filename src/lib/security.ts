import { NextRequest } from 'next/server';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Input validation schemas
export const UserInputSchema = z.object({
  email: z.string().email().max(255).trim(),
  displayName: z.string().min(1).max(50).trim(),
  password: z.string().min(8).max(128),
});

export const ChatMessageSchema = z.object({
  content: z.string().min(1).max(500).trim(),
});

export const BettingSchema = z.object({
  matchId: z.string().uuid(),
  teamId: z.string().uuid(),
  amount: z.number().int().min(1).max(1000000),
  odds: z.number().min(1.01).max(100),
});

export const GamePlaySchema = z.object({
  gameType: z.enum(['plinko', 'crash', 'coinflip', 'sweeper', 'crate']),
  gameId: z.string().uuid(),
  betAmount: z.number().int().min(1).max(1000000),
  customClientSeed: z.string().max(64).optional(),
});

export const AdminActionSchema = z.object({
  userId: z.string().uuid(),
  action: z.enum(['ban', 'mute', 'warn', 'unban', 'unmute']),
  reason: z.string().max(500).optional(),
  duration: z.number().int().min(0).max(31536000).optional(), // Max 1 year in seconds
});

// Rate limiting
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

// Input sanitization
export function sanitizeHtml(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

export function sanitizeText(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

export function sanitizeSqlIdentifier(input: string): string {
  // Only allow alphanumeric characters and underscores for SQL identifiers
  return input.replace(/[^a-zA-Z0-9_]/g, '');
}

// CSRF protection
export function generateCSRFToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  
  const crypto = require('crypto');
  const expectedToken = crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback')
    .update(sessionToken)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

// Request validation
export function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const body = request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`,
      };
    }
    return {
      success: false,
      error: 'Invalid request format',
    };
  }
}

// SQL injection prevention
export function validateSqlQuery(query: string): boolean {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\b(UNION|OR|AND)\b.*\b(SELECT|INSERT|UPDATE|DELETE)\b)/i,
    /(\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b)/i,
    /(\b(CHAR|ASCII|SUBSTRING|LEN|DATALENGTH)\b)/i,
    /(\b(WAITFOR|DELAY|SLEEP)\b)/i,
    /(\b(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)\b)/i,
  ];

  return !dangerousPatterns.some(pattern => pattern.test(query));
}

// XSS prevention
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// File upload validation
export function validateFileUpload(
  file: File,
  maxSize: number = 5 * 1024 * 1024, // 5MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type' };
  }

  // Check file extension matches MIME type
  const extension = file.name.split('.').pop()?.toLowerCase();
  const expectedExtensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp'],
  };

  if (extension && expectedExtensions[file.type] && !expectedExtensions[file.type].includes(extension)) {
    return { valid: false, error: 'File extension does not match file type' };
  }

  return { valid: true };
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Check for common passwords
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ];

  if (commonPasswords.includes(password.toLowerCase())) {
    feedback.push('Password is too common');
    score = Math.max(0, score - 2);
  }

  return {
    valid: score >= 4 && feedback.length === 0,
    score,
    feedback,
  };
}

// Session security
export function validateSessionSecurity(session: any): boolean {
  if (!session || !session.user_id || !session.token) {
    return false;
  }

  // Check session age (max 24 hours)
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  if (session.created_at && Date.now() - new Date(session.created_at).getTime() > maxAge) {
    return false;
  }

  // Check token format (should be a valid UUID or similar)
  const tokenPattern = /^[a-f0-9-]{36}$/i;
  if (!tokenPattern.test(session.token)) {
    return false;
  }

  return true;
}

// IP address validation
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-remote-addr');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}

// Content Security Policy
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': getCSPHeader(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

// Audit logging
export function logSecurityEvent(
  event: string,
  details: Record<string, any>,
  request?: NextRequest
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: request ? getClientIP(request) : 'unknown',
    userAgent: request?.headers.get('user-agent') || 'unknown',
  };

  // In production, this should be sent to a proper logging service
  console.log('SECURITY_EVENT:', JSON.stringify(logEntry));
}

// Data privacy helpers
export function sanitizeUserData(user: any): any {
  const sanitized = { ...user };
  
  // Remove sensitive fields
  delete sanitized.passwordHash;
  delete sanitized.password;
  delete sanitized.email; // Only include if necessary
  delete sanitized.internal_notes;
  delete sanitized.admin_notes;
  
  // Hash or mask sensitive data
  if (sanitized.steamId) {
    sanitized.steamId = sanitized.steamId.substring(0, 8) + '***';
  }
  
  return sanitized;
}

export function shouldLogUserData(dataType: string): boolean {
  // Define what user data should be logged
  const loggableData = [
    'login_attempts',
    'security_events',
    'admin_actions',
    'payment_events',
  ];
  
  return loggableData.includes(dataType);
}
