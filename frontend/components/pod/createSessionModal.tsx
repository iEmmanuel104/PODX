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
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { sessionType } from "@/constants";
import SimpleTimePicker from "./simpleTimePicker";
import DotPattern from "../ui/dot-pattern";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

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

    const isDateTimeInPast = (date: Date, timeStr?: string): boolean => {
        if (!timeStr) return false;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const dateWithTime = new Date(date);
        dateWithTime.setHours(hours, minutes, 0, 0);
        return isBefore(dateWithTime, new Date());
    };

    const handleTimeChange = (value: string) => {
        setCustomTime(value);
        setTimeError("");

        if (value === "") {
            updateFormState({ time: undefined });
            return;
        }

        if (validateTime(value)) {
            if (formState.date && isDateTimeInPast(formState.date, value)) {
                setTimeError("Cannot schedule for a past time");
                return;
            }
            updateFormState({ time: value });
        } else {
            setTimeError("Please enter time in HH:mm format");
        }
    };

    const handleTimeSelect = (value: string) => {
        if (formState.date && isDateTimeInPast(formState.date, value)) {
            setTimeError("Cannot schedule for a past time");
            return;
        }
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
            <DialogContent className="bg-[#1d1d1d] text-white rounded-2xl p-8 w-full max-w-lg overflow-hidden border border-white/[0.1]">
                {/* Background gradient - moved behind content */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent" />
                </div>


                <DotPattern
                    width={20}
                    height={20}
                    cx={2}
                    cy={2}
                    cr={1}
                    className={cn(
                        "[mask-image:radial-gradient(to_bottom_right,white,transparent,transparent)] rounded-[20px] top-[6px] left-[8px] px-[10px]"
                    )}
                />
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold text-[#d4d4d4]">Create session</DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-4 mb-6">
                    <Button
                        size="sm"
                        className={`rounded-full ${!formState.isScheduled ? "bg-[#6032F6] hover:bg-[#6D28D9]" : "bg-[#1e1e1e] border border-zinc-600"
                            }`}
                        onClick={() => updateFormState({ isScheduled: false })}
                    >
                        Instant session
                    </Button>
                    <Button
                        size="sm"
                        className={`rounded-full ${formState.isScheduled ? "bg-[#6032F6] hover:bg-[#6D28D9]" : "bg-[#1e1e1e] border border-zinc-600"
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
                                            onSelect={(date) => {
                                                updateFormState({ date });
                                                setTimeError("");
                                            }}
                                            disabled={(date) => isBefore(date, startOfDay(new Date())) || date > addDays(new Date(), 30)}
                                            className="bg-[#2C2C2C] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                {/* New Time Picker */}
                                <SimpleTimePicker
                                    value={formState.time || ""}
                                    onChange={(newTime) => {
                                        if (formState.date && isDateTimeInPast(formState.date, newTime)) {
                                            setTimeError("Cannot schedule for a past time");
                                            return;
                                        }
                                        updateFormState({ time: newTime });
                                        setTimeError("");
                                    }}
                                    error={timeError}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white/70">Token Gating</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/50 cursor-help">
                                            ?
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Control access using token ownership</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        <Switch
                            className="relative bg-transparent border-2 border-transparent py-2.5 
                   data-[state=checked]:bg-transparent data-[state=unchecked]:bg-transparent
                   before:absolute before:inset-0 before:rounded-full
                   before:bg-gradient-to-r before:from-blue-500 before:to-purple-500
                   before:-z-10"
                        />
                    </div>

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