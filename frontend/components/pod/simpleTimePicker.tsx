'use client';
import React, { useState, useRef } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface SimpleTimePickerProps {
    value: string;
    onChange: (time: string) => void;
    error?: string;
}

const SimpleTimePicker: React.FC<SimpleTimePickerProps> = ({ value, onChange, error }) => {
    const [isAM, setIsAM] = useState(true);

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;

        // Allow direct input of numbers and colon
        if (!/^[\d:]*$/.test(input)) return;

        // Handle backspace and regular input
        if (input.length <= 5) {
            let formattedTime = input;

            // Add colon if user types 4 numbers without colon
            if (input.length === 4 && !input.includes(':')) {
                formattedTime = input.slice(0, 2) + ':' + input.slice(2);
            }

            // Validate final format when input is complete
            if (input.length === 5) {
                const [hours, minutes] = formattedTime.split(':').map(Number);

                // Validate hours (1-12)
                if (hours > 12) formattedTime = '12:' + formattedTime.slice(3);
                if (hours === 0) formattedTime = '12:' + formattedTime.slice(3);

                // Validate minutes (00-59)
                if (minutes >= 60) formattedTime = formattedTime.slice(0, 3) + '59';
            }

            onChange(formattedTime);
        }
    };

    const toggleAMPM = () => {
        setIsAM(!isAM);
        // Convert the time based on AM/PM toggle
        if (value) {
            const [hours, minutes] = value.split(':').map(Number);
            let newHours = hours;

            if (isAM && hours < 12) {
                newHours = hours + 12;
            } else if (!isAM && hours >= 12) {
                newHours = hours - 12;
            }

            onChange(
                `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
            );
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <div className="relative flex-1">
                <Input
                    type="text"
                    value={value}
                    onChange={handleTimeChange}
                    placeholder="HH:MM"
                    className="bg-[#2C2C2C] text-white rounded-[10px] px-4 h-10"
                    maxLength={5}
                />
                {error && (
                    <span className="text-red-500 text-sm mt-1 absolute -bottom-6 left-0">
                        {error}
                    </span>
                )}
            </div>
            <Button
                type="button"
                onClick={toggleAMPM}
                className={`w-16 h-10 ${
                    isAM ? 'bg-[#6032F6] text-white' : 'bg-[#2C2C2C] text-white'
                } hover:bg-[#4C28C4] rounded-[10px]`}
            >
                {isAM ? 'AM' : 'PM'}
            </Button>
        </div>
    );
};

export default SimpleTimePicker;
