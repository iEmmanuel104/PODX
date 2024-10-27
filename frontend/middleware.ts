// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // Clone the response
    const response = NextResponse.next();

    // Force dynamic rendering for all routes
    response.headers.set('x-middleware-cache', 'no-cache');
    response.headers.set('Cache-Control', 'no-store');

    return response;
}

export const config = {
    matcher: [
        // Add paths that should be dynamic
        '/pod/:path*',
        // Add other paths as needed
    ],
};