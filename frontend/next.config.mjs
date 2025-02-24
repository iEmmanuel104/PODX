/** @type {import('next').NextConfig} */
const nextConfig = {
    // Optimize image handling
    images: {
        domains: ['ipfs.io'],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
    },

    // Enable compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
    },

    // Optimize production builds
    swcMinify: true,

    // Production-safe experimental features
    experimental: {
        // Remove optimizeCss as it requires critters
        // optimizeCss: true,
        optimizePackageImports: [
            '@stream-io/video-react-sdk',
            'stream-chat-react',
            'lucide-react',
            'recharts',
        ],
    },

    // Configure webpack for better optimization
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            // Optimize chunk splitting
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 244000,
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    cacheGroups: {
                        defaultVendors: {
                            test: /[\\/]node_modules[\\/]/,
                            priority: -10,
                            reuseExistingChunk: true,
                        },
                        default: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true,
                        },
                        retroGrid: {
                            test: /[\\/]components[\\/]ui[\\/]retro-grid/,
                            name: 'retro-grid',
                            priority: 1,
                            reuseExistingChunk: true,
                            enforce: true
                        },
                    },
                },
                minimize: true,
            };
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
                    // Add security headers for production
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // Updated Permissions-Policy to allow camera and microphone
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=self, microphone=self, geolocation=()',
                    }, // This is the default value
                ],
            },
        ];
    },

    // Production optimization for static pages
    output: 'standalone',
    poweredByHeader: false,
    generateEtags: true,
    compress: true,

    // Disable certain features in development
    ...(process.env.NODE_ENV === 'development' && {
        reactStrictMode: true,
        optimizeFonts: false,
    }),
};

export default nextConfig;
