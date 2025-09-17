import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from './auth-utils';
import { checkRateLimit, logSecurityEvent, getClientIP } from './security';

// Enhanced authentication middleware with security features
export async function requireAuth(
  request: NextRequest,
  options: {
    requireRole?: string;
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
  } = {}
): Promise<{ success: true; session: any } | { success: false; response: NextResponse }> {
  try {
    // Rate limiting
    if (options.rateLimit) {
      const clientIP = getClientIP(request);
      const rateLimitResult = checkRateLimit(
        `auth_${clientIP}`,
        options.rateLimit.maxRequests,
        options.rateLimit.windowMs
      );

      if (!rateLimitResult.allowed) {
        logSecurityEvent('rate_limit_exceeded', {
          ip: clientIP,
          endpoint: request.url,
        }, request);

        return {
          success: false,
          response: NextResponse.json(
            { error: 'Too many requests' },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
              }
            }
          ),
        };
      }
    }

    // Get session
    const session = await getAuthSession(request);
    
    if (!session) {
      logSecurityEvent('unauthorized_access_attempt', {
        ip: getClientIP(request),
        endpoint: request.url,
        userAgent: request.headers.get('user-agent'),
      }, request);

      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    // Check role requirement
    if (options.requireRole && session.role !== options.requireRole) {
      logSecurityEvent('insufficient_permissions', {
        userId: session.user_id,
        requiredRole: options.requireRole,
        userRole: session.role,
        endpoint: request.url,
      }, request);

      return {
        success: false,
        response: NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        ),
      };
    }

    return { success: true, session };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication error' },
        { status: 500 }
      ),
    };
  }
}

// Admin-only middleware
export async function requireAdmin(request: NextRequest) {
  return requireAuth(request, { requireRole: 'admin' });
}

// Moderator or admin middleware
export async function requireModerator(request: NextRequest) {
  const result = await requireAuth(request);
  if (!result.success) return result;

  if (!['admin', 'moderator'].includes(result.session.role)) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Moderator access required' },
        { status: 403 }
      ),
    };
  }

  return result;
}

// CSRF protection middleware
export function validateCSRF(request: NextRequest, sessionToken: string): boolean {
  const csrfToken = request.headers.get('x-csrf-token');
  if (!csrfToken) return false;

  const crypto = require('crypto');
  const expectedToken = crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'fallback')
    .update(sessionToken)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(csrfToken, 'hex'),
    Buffer.from(expectedToken, 'hex')
  );
}

// Request validation middleware
export function validateRequestSchema<T>(
  request: NextRequest,
  schema: any
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    // This would need to be implemented with proper async request body parsing
    // For now, we'll return a placeholder
    return { success: true, data: {} as T };
  } catch (error) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      ),
    };
  }
}
