import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const loadingOverlayVariants = cva("fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm", {
    variants: {
        variant: {
            default: "bg-background/60",
            dark: "bg-background/80",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

interface LoadingOverlayProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof loadingOverlayVariants> {
    text?: string;
}

const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingOverlayProps>(({ className, variant, text = "Loading...", ...props }, ref) => (
    <div ref={ref} className={cn(loadingOverlayVariants({ variant }), className)} {...props}>
        <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#6032F6]" />
            <p className="text-lg font-medium text-white">{text}</p>
        </div>
    </div>
));
LoadingOverlay.displayName = "LoadingOverlay";

export { LoadingOverlay };
