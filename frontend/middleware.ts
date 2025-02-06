import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

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