'use client';
import React, { useState, useRef } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SimpleTimePickerProps {
    value: string;
    onChange: (newTime: string) => void;
    error?: string;
}

const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ value, onChange, error }) => {
    const [isOpen, setIsOpen] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, "0"));

    const [selectedHour, selectedMinute] = value ? value.split(":") : ["00", "00"];

    return (
        <div className="relative">
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] hover:bg-[#3c3c3c]"
                    >
                        <Clock className="mr-2 h-4 w-4 text-[#6032F6]" />
                        {value || "Select time"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 bg-[#2C2C2C]" align="start">
                    <div className="flex gap-2 p-2">
                        <div className="flex-1">
                            <div className="relative h-40 overflow-hidden rounded bg-[#1E1E1E]">
                                <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
                                    {hours.map((hour) => (
                                        <div
                                            key={hour}
                                            className={`h-10 flex items-center justify-center cursor-pointer hover:bg-[#3C3C3C] transition-colors ${
                                                hour === selectedHour ? "bg-[#6032F6] text-white" : ""
                                            }`}
                                            onClick={() => {
                                                const newTime = `${hour}:${selectedMinute}`;
                                                onChange(newTime);
                                            }}
                                        >
                                            {hour}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="relative h-40 overflow-hidden rounded bg-[#1E1E1E]">
                                <div className="absolute inset-0 overflow-y-auto scrollbar-hide">
                                    {minutes.map((minute) => (
                                        <div
                                            key={minute}
                                            className={`h-10 flex items-center justify-center cursor-pointer hover:bg-[#3C3C3C] transition-colors ${
                                                minute === selectedMinute ? "bg-[#6032F6] text-white" : ""
                                            }`}
                                            onClick={() => {
                                                const newTime = `${selectedHour}:${minute}`;
                                                onChange(newTime);
                                            }}
                                        >
                                            {minute}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default SimpleTimePicker;
