
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';
  const { pathname } = request.nextUrl
 
  // Handle maintenance mode first
  if (maintenanceMode) {
    // Allow access to the maintenance page and admin dashboard
    if (
      pathname.startsWith('/maintenance') || 
      pathname.startsWith('/dashboard/admin') || 
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/logo.png') // Allow logo to be displayed
    ) {
      return NextResponse.next()
    }
 
    // For all other paths, rewrite to the maintenance page
    request.nextUrl.pathname = `/maintenance`
    return NextResponse.rewrite(request.nextUrl)
  }

  // Authentication middleware for protected routes
  if (pathname.startsWith('/dashboard')) {
    // Only allow access with a valid session token (not Steam auth token)
    // This ensures consistency with protected API endpoints
    const sessionToken = request.cookies.get('equipgg_session')?.value
    
    console.log('Middleware check for:', pathname);
    console.log('Session token:', sessionToken ? 'present' : 'missing');
    console.log('All cookies:', request.cookies.getAll().map(c => c.name));
    
    // If no session token found, redirect to signin
    if (!sessionToken) {
      console.log('No session token, redirecting to signin');
      const signInUrl = new URL('/signin', request.url)
      signInUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(signInUrl)
    }
  }
 
  return NextResponse.next()
}
 
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
