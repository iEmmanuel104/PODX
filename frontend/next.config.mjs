/** @type {import('next').NextConfig} */
const nextConfig = {
    // Optimize image handling
    images: {
        domains: ['api.placeholder'],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    // Enable compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Optimize production builds
    swcMinify: true,

    // Enable module/page level compilation caching
    experimental: {
        optimizeCss: true,
        optimizePackageImports: [
            '@stream-io/video-react-sdk',
            'stream-chat-react',
            'lucide-react',
            'recharts'
        ],
    },

    // Configure webpack for better optimization
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            config.optimization.splitChunks.chunks = 'all';
            config.optimization.minimize = true;
        }
        return config;
    },

    // Basic security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                ],
            },
        ];
    },

    // Override Next.js page configuration globally
    async rewrites() {
        return {
            beforeFiles: [
                {
                    source: '/:path*',
                    has: [
                        {
                            type: 'header',
                            key: 'x-revalidate',
                        },
                    ],
                    destination: '/:path*',
                },
            ],
        };
    },
};

// Export the configuration
export default nextConfig;