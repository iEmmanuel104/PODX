import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();
    
    // Check if this is a pod route
    const isPodPage = request.nextUrl.pathname.startsWith('/pod/');
    const isPodJoinPage = request.nextUrl.pathname.startsWith('/pod/join/');
    const isMainPodPage = request.nextUrl.pathname === '/pod';
    
    // For direct pod links or join links, check if user has a valid auth cookie
    if ((isPodPage && !isMainPodPage) || isPodJoinPage) {
        const hasPrivyAuth = request.cookies.has('privy-token');
        const hasCustomAuth = request.cookies.has('podx-auth');
        
        // If user is not authenticated, redirect to home and save the session ID
        if (!hasPrivyAuth && !hasCustomAuth) {
            // Extract the session ID
            let sessionId;
            if (isPodJoinPage) {
                sessionId = request.nextUrl.pathname.split('/pod/join/')[1];
            } else {
                sessionId = request.nextUrl.pathname.split('/pod/')[1];
            }
            
            // Create a redirect response to the homepage
            const redirectUrl = new URL('/', request.url);
            const redirectResponse = NextResponse.redirect(redirectUrl);
            
            // Store the session ID to redirect back after authentication
            if (sessionId) {
                redirectResponse.cookies.set('pendingSessionCode', sessionId, {
                    path: '/',
                    maxAge: 3600 // 1 hour
                });
            }
            
            console.debug('Middleware redirecting unauthenticated user from pod page to home');
            return redirectResponse;
        }
    }

    // Essential Security Headers
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Only set cache headers for pod routes
    if (request.nextUrl.pathname.startsWith('/pod')) {
        response.headers.set('Cache-Control', 'no-store');
    }

    return response;
}

export const config = {
    matcher: [
        '/pod/:path*',
        // Exclude static files and api routes
        '/((?!_next/static|_next/image|favicon.ico|api).*)',
    ],
};
