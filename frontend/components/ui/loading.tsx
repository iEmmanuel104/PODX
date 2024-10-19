import * as React from "react";
import Image from "next/image";

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
    text?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(({ className, text = "Loading...", ...props }, ref) => (
    <div
        ref={ref}
        className={`fixed inset-0 z-50 flex items-center justify-center bg-[#121212] bg-opacity-80 backdrop-blur-sm ${className}`}
        {...props}
    >
        <div className="flex flex-col items-center space-y-4">
            <div className="text-4xl font-bold text-white flex items-center">
                <span className="inline-block animate-pulse-fade">P</span>
                <span className="inline-block animate-pulse-fade" style={{ animationDelay: "0.2s" }}>
                    o
                </span>
                <span className="inline-block animate-pulse-fade" style={{ animationDelay: "0.4s" }}>
                    d
                </span>
                <div
                    className="relative inline-flex items-center justify-center w-10 h-10 rounded-full ml-1 animate-pulse-fade overflow-hidden"
                    style={{ animationDelay: "0.6s" }}
                >
                    <Image src="/logo.png" alt="PodX Logo" layout="fill" objectFit="contain" />
                </div>
            </div>
            <p className="text-lg font-medium text-white animate-pulse-fade" style={{ animationDelay: "0.8s" }}>
                {text}
            </p>
        </div>
    </div>
));

LoadingOverlay.displayName = "LoadingOverlay";

export { LoadingOverlay };
