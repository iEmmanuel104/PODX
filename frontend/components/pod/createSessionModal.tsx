"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Mic, Video, CalendarIcon, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import { sessionType as sessionTypeEnum } from '@/constants';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (title: string, type: sessionTypeEnum, date: Date, time: string) => void;
}

export default function Component(
    { isOpen, onClose, onCreateSession }: CreateSessionModalProps = {
        isOpen: true,
        onClose: () => {},
        onCreateSession: () => {},
    }
) {
    const [sessionTitle, setSessionTitle] = useState("Demo Session");
    const [sessionType, setSessionType] = useState<sessionTypeEnum>(sessionTypeEnum.POD);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [selectedTime, setSelectedTime] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateSession = () => {
        if (!sessionTitle.trim() || !selectedDate || !selectedTime) return;
        setIsCreating(true);
        onCreateSession(sessionTitle, sessionType, selectedDate, selectedTime);
        setIsCreating(false);
        onClose();
    };

    // Generate time slots
    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, "0");
        return `${hour}:00`;
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-[10px] p-6 w-full max-w-md">
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">Create session</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-4">
                    <Button size="sm" className="rounded-full bg-[#1e1e1e] border border-zinc-600">
                        Instant session
                    </Button>
                    <Button size="sm" className="rounded-full bg-[#6032F6] hover:bg-[#6D28D9] text-white flex items-center gap-2">
                        Schedule session <span className="text-yellow-300 rounded-full px-1 text-xs bg-yellow-700">New</span>
                    </Button>
                </div>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="sessionTitle" className="block text-[#A3A3A3] mb-2">
                            Session title
                        </label>
                        <Input
                            id="sessionTitle"
                            value={sessionTitle}
                            onChange={(e) => setSessionTitle(e.target.value)}
                            className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] active:border-[#3c3c3c] active:ring-[#3c3c3c]"
                        />
                    </div>
                    <div>
                        <label htmlFor="sessionType" className="block text-[#A3A3A3] mb-2">
                            Session type
                        </label>
                        <Select value={sessionType} onValueChange={(value: sessionTypeEnum) => setSessionType(value)}>
                            <SelectTrigger className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] active:border-[#3c3c3c] active:ring-[#3c3c3c]">
                                <SelectValue>
                                    {sessionType === sessionTypeEnum.AUDIO && <Mic className="h4 w-6 text-[#6032F6] inline-flex mr-2" />}
                                    {sessionType === sessionTypeEnum.POD && <Video className="h4 w-6 text-[#6032F6] inline-flex mr-2" />}
                                    {sessionType}
                                    {sessionType === sessionTypeEnum.AUDIO && (
                                        <span className="mx-2 rounded-full p-1 bg-[#DDB958] text-black">Coming soon</span>
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2C] text-white">
                                <SelectItem value="Audio Session" className="flex items-center hover:bg-red-300">
                                    <Mic className="h4 w-6 text-[#6032F6] inline-flex mr-2" />
                                    Audio Session <span className="mx-2 rounded-full p-1 bg-[#DDB958] text-black">Coming soon</span>
                                </SelectItem>
                                <SelectItem value="Pod Session">
                                    <Video className="h4 w-6 text-[#6032F6] inline-flex mr-2" />
                                    Pod Session
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label htmlFor="dateTime" className="block text-[#A3A3A3] mb-2">
                            Date and time
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] active:border-[#3c3c3c] active:ring-[#3c3c3c] hover:bg-[#3c3c3c] hover:text-white text-white ${
                                            !selectedDate && "text-muted-foreground"
                                        }`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 text-[#6032F6]" />
                                        {selectedDate ? format(selectedDate, "PPP") : <span className="text-white">Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#2C2C2C]" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={setSelectedDate}
                                        initialFocus
                                        disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                                        className="bg-[#2C2C2C] text-white"
                                    />
                                </PopoverContent>
                            </Popover>
                            <Select value={selectedTime} onValueChange={setSelectedTime}>
                                <SelectTrigger className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] active:border-[#3c3c3c] active:ring-[#3c3c3c] hover:bg-[#3c3c3c]">
                                    <Clock className="h-4 w-4 mr-2 text-[#6032F6]" />
                                    <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#2C2C2C] text-white">
                                    {timeSlots.map((time) => (
                                        <SelectItem key={time} value={time}>
                                            {time}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <label htmlFor="proofOfAttendance" className="block text-[#A3A3A3] mb-2">
                            Proof of attendance
                        </label>
                        <Switch id="proof-of-attendance" onCheckedChange={() => {}} />
                    </div>
                    <div className="flex justify-between gap-6 pt-3">
                        <Button onClick={onClose} className="w-1/2 px-4 py-6 bg-[#2C2C2C] rounded-[10px] hover:bg-[#3C3C3C] transition-colors">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            disabled={!sessionTitle.trim() || !selectedDate || !selectedTime || isCreating}
                            className="w-1/2 px-4 py-6 bg-[#6032F6] rounded-[10px] hover:bg-[#6D28D9] transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                        >
                            {isCreating ? "Creating..." : "Create session"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
