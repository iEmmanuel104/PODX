import React, { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface IconButtonProps {
    icon: ReactNode;
    onClick?: () => void;
    active?: boolean;
    variant?: "primary" | "secondary";
    alert?: boolean;
    title?: string;
    className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ active = false, alert = false, icon, onClick, variant = "primary", title, className }) => {
    const alertIcon = (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF8C00] rounded-full flex items-center justify-center">
            <AlertCircle className="w-3 h-3 text-white" />
        </div>
    );

    return (
        <button
            onClick={onClick}
            title={title}
            className={cn(
                "relative inline-flex items-center justify-center text-center text-base font-medium transition-colors",
                variant === "primary"
                    ? "h-9 w-9 rounded-full hover:bg-[#3C3C3C] disabled:bg-transparent disabled:text-gray-500"
                    : cn(
                          "h-14 w-14 rounded-full border border-solid",
                          active ? "bg-red-500 border-red-500 hover:bg-red-600 hover:border-red-600" : "hover:bg-[rgba(255,255,255,0.2)] border-white"
                      ),
                className
            )}
            disabled={variant === "primary" && active}
        >
            {icon}
            {alert && alertIcon}
        </button>
    );
};

export default IconButton;
