
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
// Avoid heavy server helpers inside middleware (edge). Use lightweight cookie parse + public API.
 
export async function middleware(request: NextRequest) {
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

  // Page toggle enforcement for dashboard sub-pages (non-admin)
  if (pathname.startsWith('/dashboard/')) {
    // Extract segment after /dashboard/
    const parts = pathname.split('/').filter(Boolean); // e.g., ['', 'dashboard', 'shop'] -> ['dashboard','shop']
    const section = parts[1];
    if (section && section !== 'admin') {
      try {
        // Fetch toggles from public endpoint (ensure absolute URL for edge)
        let toggles: Record<string, boolean> = {};
        try {
          const origin = request.nextUrl.origin;
          const res = await fetch(origin + '/api/page-toggles', { cache: 'no-store' });
          if (res.ok) {
            const data = await res.json();
            toggles = data.toggles || {};
          }
        } catch {/* ignore */}

        // Parse role from equipgg_session cookie (JSON) if present for admin bypass
        let isAdmin = false;
        const rawCookie = request.cookies.get('equipgg_session')?.value;
        if (rawCookie) {
          try {
            let decoded = decodeURIComponent(rawCookie);
            try { decoded = decodeURIComponent(decoded); } catch {/* single decode okay */}
            const parsed = JSON.parse(decoded);
            if (parsed?.role === 'admin') isAdmin = true;
          } catch {/* ignore parse errors */}
        }
        // Preview override: if ?preview=1, treat admin as non-admin to preview toggles
        const preview = request.nextUrl.searchParams.get('preview');
        if (preview === '1') {
          isAdmin = false;
        }
        // If toggle explicitly false (disabled) and user not admin, redirect to /dashboard
        if (toggles && Object.prototype.hasOwnProperty.call(toggles, section) && toggles[section] === false && !isAdmin) {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      } catch (e) {
        // Fail open on errors
      }
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
