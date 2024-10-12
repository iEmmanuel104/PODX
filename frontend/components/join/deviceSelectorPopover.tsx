import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface DeviceSelectorPopoverProps {
    icon: React.ReactNode;
    children: React.ReactNode;
}
const DeviceSelectorPopover: React.FC<DeviceSelectorPopoverProps> = ({ icon, children }) => (
    <Popover>
        <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="bg-[#2C2C2C] text-white border-none rounded-full px-3 py-1 flex items-center space-x-2">
                {icon}
                <ChevronDown className="h-4 w-4" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0">{children}</PopoverContent>
    </Popover>
);

export default DeviceSelectorPopover;
