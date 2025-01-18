/** @type {import('next').NextConfig} */
const nextConfig = {
    // Optimize image handling
    images: {
        domains: ['api.placeholder'],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Optimize image sizes
        imageSizes: [16, 32, 48, 64, 96, 128, 256], // Optimize thumbnail sizes
    },

    // Enable compiler optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production',
        styledComponents: true, // Enable CSS-in-JS optimization
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
            '@privy-io/react-auth', // Added Privy
            'react-redux',  // Added for Redux
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
                            name: 'vendors',
                        },
                        common: {
                            minChunks: 2,
                            priority: -20,
                            reuseExistingChunk: true,
                            name: 'common',
                        },
                        // New cache groups for specific packages
                        privy: {
                            test: /[\\/]node_modules[\\/]@privy-io[\\/]/,
                            name: 'privy',
                            priority: 10,
                        },
                        redux: {
                            test: /[\\/]node_modules[\\/]redux[\\/]/,
                            name: 'redux',
                            priority: 10,
                        },
                    },
                },
                minimize: true,
                runtimeChunk: {
                    name: 'runtime',
                },
            };

            // Add module concatenation
            config.optimization.concatenateModules = true;

            // Add module scope hoisting
            config.optimization.moduleIds = 'deterministic';
        }

        return config;
    },

    // Enhanced security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // Add security headers for production
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // Updated Permissions-Policy to allow camera and microphone
                    { key: 'Permissions-Policy', value: 'camera=self, microphone=self, geolocation=()' },                    // Add Content Security Policy
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.privy.io https://*.walletconnect.org;"
                    },
                    // Add Feature Policy
                    {
                        key: 'Feature-Policy',
                        value: "camera 'self'; microphone 'self'; geolocation 'none'"
                    }
                ],
            },
        ];
    },

    // Production optimization for static pages
    output: 'standalone',
    poweredByHeader: false,
    generateEtags: true,
    compress: true,

    // Environment-specific settings
    ...(process.env.NODE_ENV === 'development'
        ? {
            reactStrictMode: true,
            optimizeFonts: false,
        }
        : {
            reactStrictMode: true,
            optimizeFonts: true,
            productionBrowserSourceMaps: false,
        }
    ),
};

export default nextConfig;