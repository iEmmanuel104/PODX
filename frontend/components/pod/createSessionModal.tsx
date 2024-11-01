"use client";
import React, { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Mic, Video, CalendarIcon, Clock } from "lucide-react";
import { format, addDays } from "date-fns";
import { sessionType } from "@/constants";

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (title: string, type: sessionType, scheduledDate?: Date) => void;
}

interface SessionFormState {
    title: string;
    type: sessionType;
    isScheduled: boolean;
    date?: Date;
    time?: string;
}

const DEFAULT_SESSION_TITLE = "Demo Session";

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ isOpen, onClose, onCreateSession }) => {
    const [formState, setFormState] = useState<SessionFormState>({
        title: DEFAULT_SESSION_TITLE,
        type: sessionType.POD,
        isScheduled: false,
        date: undefined,
        time: undefined,
    });
    const [isCreating, setIsCreating] = useState(false);
    const [customTime, setCustomTime] = useState("");
    const [timeError, setTimeError] = useState("");

    // Memoized time slots for dropdown
    const timeSlots = React.useMemo(() => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`), []);

    const validateTime = (time: string): boolean => {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    };

    const handleTimeChange = (value: string) => {
        setCustomTime(value);
        setTimeError("");

        if (value === "") {
            updateFormState({ time: undefined });
            return;
        }

        if (validateTime(value)) {
            updateFormState({ time: value });
        } else {
            setTimeError("Please enter time in HH:mm format");
        }
    };

    const handleTimeSelect = (value: string) => {
        setCustomTime(value);
        updateFormState({ time: value });
        setTimeError("");
    };

    const handleCreateSession = useCallback(async () => {
        if (!formState.title.trim()) return;
        if (formState.isScheduled && timeError) return;

        setIsCreating(true);
        try {
            let scheduledDate: Date | undefined;

            if (formState.isScheduled && formState.date && formState.time) {
                const [hours, minutes = 0] = formState.time.split(":").map(Number);
                scheduledDate = new Date(formState.date);
                scheduledDate.setHours(hours, minutes, 0, 0);
            }

            await onCreateSession(formState.title, formState.type, scheduledDate);
            onClose();
        } finally {
            setIsCreating(false);
        }
    }, [formState, onCreateSession, onClose, timeError]);

    const updateFormState = useCallback((updates: Partial<SessionFormState>) => {
        setFormState((prev) => ({ ...prev, ...updates }));
    }, []);

    const isSubmitDisabled = formState.isScheduled
        ? !formState.title.trim() || !formState.date || !formState.time || isCreating || !!timeError
        : !formState.title.trim() || isCreating;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-[10px] p-6 w-full max-w-md">
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold">Create session</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-4 mb-6">
                    <Button
                        size="sm"
                        className={`rounded-full ${
                            !formState.isScheduled ? "bg-[#6032F6] hover:bg-[#6D28D9]" : "bg-[#1e1e1e] border border-zinc-600"
                        }`}
                        onClick={() => updateFormState({ isScheduled: false })}
                    >
                        Instant session
                    </Button>
                    <Button
                        size="sm"
                        className={`rounded-full ${
                            formState.isScheduled ? "bg-[#6032F6] hover:bg-[#6D28D9]" : "bg-[#1e1e1e] border border-zinc-600"
                        }`}
                        onClick={() => updateFormState({ isScheduled: true })}
                    >
                        Schedule session <span className="text-yellow-300 rounded-full px-1 text-xs bg-yellow-700">New</span>
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Session Title Input */}
                    <div>
                        <label className="block text-[#A3A3A3] mb-2">Session title</label>
                        <Input
                            value={formState.title}
                            onChange={(e) => updateFormState({ title: e.target.value })}
                            className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c]"
                        />
                    </div>

                    {/* Session Type Select */}
                    <div>
                        <label className="block text-[#A3A3A3] mb-2">Session type</label>
                        <Select value={formState.type} onValueChange={(value: sessionType) => updateFormState({ type: value })}>
                            <SelectTrigger className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c]">
                                <SelectValue>
                                    {formState.type === sessionType.AUDIO && <Mic className="h4 w-6 text-[#6032F6] inline-flex mr-2" />}
                                    {formState.type === sessionType.POD && <Video className="h4 w-6 text-[#6032F6] inline-flex mr-2" />}
                                    {formState.type}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2C] text-white">
                                <SelectItem value={sessionType.AUDIO}>
                                    <Mic className="h4 w-6 text-[#6032F6] inline-flex mr-2" />
                                    Audio Session
                                </SelectItem>
                                <SelectItem value={sessionType.POD}>
                                    <Video className="h4 w-6 text-[#6032F6] inline-flex mr-2" />
                                    Pod Session
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date and Time Selection - Only shown when scheduled */}
                    {formState.isScheduled && (
                        <div>
                            <label className="block text-[#A3A3A3] mb-2">Date and time</label>
                            <div className="grid grid-cols-2 gap-4">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] hover:bg-[#3c3c3c]"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-[#6032F6]" />
                                            {formState.date ? format(formState.date, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#2C2C2C]" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={formState.date}
                                            onSelect={(date) => updateFormState({ date })}
                                            disabled={(date) => date < new Date() || date > addDays(new Date(), 30)}
                                            className="bg-[#2C2C2C] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* Time Selection with Input and Dropdown */}
                                <div className="relative">
                                    <div className="flex">
                                        <Input
                                            value={customTime}
                                            onChange={(e) => handleTimeChange(e.target.value)}
                                            placeholder="HH:mm"
                                            className="w-full bg-[#2C2C2C] rounded-l-[10px] px-4 py-2 border-[#3c3c3c]"
                                        />
                                        <Select onValueChange={handleTimeSelect}>
                                            <SelectTrigger className="w-12 bg-[#2C2C2C] rounded-r-[10px] border-l-0 border-[#3c3c3c]">
                                                <Clock className="h-4 w-4 text-[#6032F6]" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#2C2C2C] text-white max-h-[200px]">
                                                {timeSlots.map((time) => (
                                                    <SelectItem key={time} value={time}>
                                                        {time}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {timeError && <p className="text-red-500 text-xs mt-1">{timeError}</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-6 pt-3">
                        <Button onClick={onClose} className="w-1/2 px-4 py-6 bg-[#2C2C2C] hover:bg-[#3C3C3C]">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            disabled={isSubmitDisabled}
                            className="w-1/2 px-4 py-6 bg-[#6032F6] hover:bg-[#6D28D9] disabled:bg-gray-500"
                        >
                            {isCreating ? "Creating..." : "Create session"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default React.memo(CreateSessionModal);
