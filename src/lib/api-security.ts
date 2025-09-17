import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, logSecurityEvent, getClientIP } from './security';

// Security middleware for API routes
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    requireAuth?: boolean;
    requireRole?: string;
    rateLimit?: {
      maxRequests: number;
      windowMs: number;
    };
    csrfProtection?: boolean;
    inputValidation?: any; // Zod schema
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Add security headers
      const securityHeaders = getSecurityHeaders();
      
      // Rate limiting
      if (options.rateLimit) {
        const clientIP = getClientIP(request);
        const rateLimitKey = `api_${clientIP}_${request.nextUrl.pathname}`;
        
        // Simple in-memory rate limiting (use Redis in production)
        const now = Date.now();
        const windowMs = options.rateLimit.windowMs;
        const maxRequests = options.rateLimit.maxRequests;
        
        // This is a simplified implementation
        // In production, use a proper rate limiting service
        console.log(`Rate limit check for ${rateLimitKey}: ${maxRequests} requests per ${windowMs}ms`);
      }

      // CSRF protection
      if (options.csrfProtection) {
        const csrfToken = request.headers.get('x-csrf-token');
        if (!csrfToken) {
          logSecurityEvent('csrf_token_missing', {
            ip: getClientIP(request),
            endpoint: request.url,
          }, request);
          
          return NextResponse.json(
            { error: 'CSRF token required' },
            { 
              status: 403,
              headers: securityHeaders
            }
          );
        }
      }

      // Input validation
      if (options.inputValidation) {
        try {
          const body = await request.json();
          const validatedData = options.inputValidation.parse(body);
          // Attach validated data to request for handler to use
          (request as any).validatedData = validatedData;
        } catch (error) {
          logSecurityEvent('input_validation_failed', {
            ip: getClientIP(request),
            endpoint: request.url,
            error: error instanceof Error ? error.message : 'Unknown error',
          }, request);
          
          return NextResponse.json(
            { error: 'Invalid input data' },
            { 
              status: 400,
              headers: securityHeaders
            }
          );
        }
      }

      // Authentication check
      if (options.requireAuth) {
        const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
        if (!sessionToken) {
          logSecurityEvent('unauthorized_api_access', {
            ip: getClientIP(request),
            endpoint: request.url,
          }, request);
          
          return NextResponse.json(
            { error: 'Authentication required' },
            { 
              status: 401,
              headers: securityHeaders
            }
          );
        }
      }

      // Call the actual handler
      const response = await handler(request);
      
      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error) {
      logSecurityEvent('api_security_error', {
        ip: getClientIP(request),
        endpoint: request.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, request);

      return NextResponse.json(
        { error: 'Internal server error' },
        { 
          status: 500,
          headers: getSecurityHeaders()
        }
      );
    }
  };
}

// Specific security wrappers for common use cases
export const withAuth = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withSecurity(handler, { requireAuth: true });

export const withAdminAuth = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withSecurity(handler, { requireAuth: true, requireRole: 'admin' });

export const withRateLimit = (
  handler: (request: NextRequest) => Promise<NextResponse>,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000
) => withSecurity(handler, { rateLimit: { maxRequests, windowMs } });

export const withCSRF = (handler: (request: NextRequest) => Promise<NextResponse>) =>
  withSecurity(handler, { csrfProtection: true });

// Content Security Policy for API responses
export function getAPICSPHeader(): string {
  return [
    "default-src 'none'",
    "script-src 'none'",
    "style-src 'none'",
    "img-src 'none'",
    "font-src 'none'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

// API-specific security headers
export function getAPISecurityHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': getAPICSPHeader(),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };
}

// Request size limiting
export function validateRequestSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false;
  }
  return true;
}

// IP whitelist/blacklist (for admin endpoints)
export function validateIPAccess(request: NextRequest, allowedIPs?: string[]): boolean {
  if (!allowedIPs || allowedIPs.length === 0) {
    return true; // No restrictions
  }

  const clientIP = getClientIP(request);
  return allowedIPs.includes(clientIP);
}

// Request origin validation
export function validateOrigin(request: NextRequest, allowedOrigins?: string[]): boolean {
  if (!allowedOrigins || allowedOrigins.length === 0) {
    return true; // No restrictions
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return false; // No origin header
  }

  return allowedOrigins.includes(origin);
}

// API key validation (for external integrations)
export function validateAPIKey(request: NextRequest, validKeys: string[]): boolean {
  const apiKey = request.headers.get('x-api-key');
  if (!apiKey) {
    return false;
  }

  return validKeys.includes(apiKey);
}

// Request timing analysis (for detecting automated attacks)
export function analyzeRequestTiming(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent');
  const acceptLanguage = request.headers.get('accept-language');
  const acceptEncoding = request.headers.get('accept-encoding');

  // Basic bot detection
  if (!userAgent || userAgent.length < 10) {
    return false; // Suspicious user agent
  }

  if (!acceptLanguage || !acceptEncoding) {
    return false; // Missing standard headers
  }

  // Check for common bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
  ];

  if (botPatterns.some(pattern => pattern.test(userAgent))) {
    return false; // Likely a bot
  }

  return true;
}

// Comprehensive security check
export function performSecurityCheck(request: NextRequest): {
  passed: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check request size
  if (!validateRequestSize(request)) {
    issues.push('Request too large');
  }

  // Check request timing
  if (!analyzeRequestTiming(request)) {
    issues.push('Suspicious request pattern');
  }

  // Check for required headers
  const requiredHeaders = ['user-agent', 'accept'];
  for (const header of requiredHeaders) {
    if (!request.headers.get(header)) {
      issues.push(`Missing required header: ${header}`);
    }
  }

  // Check for suspicious patterns in URL
  const suspiciousPatterns = [
    /\.\./, // Directory traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript injection
  ];

  const url = request.url;
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    issues.push('Suspicious URL pattern detected');
  }

  return {
    passed: issues.length === 0,
    issues,
  };
}
