'use client';
import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronLeft } from 'lucide-react';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { sessionType } from '@/constants';
import SimpleTimePicker from './simpleTimePicker';
import DotPattern from '../ui/dot-pattern';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import Retry from '@/public/images/icons/Retry';
import Twinkle from '@/public/images/icons/Twinkle';
import { MultiSelect } from '../ui/multi-select';
import CloseCircle from '@/public/icons/CloseCircle';
import TickCircle from '@/public/icons/TickCircle';
import Microphone from '@/public/icons/Microphone';
import VideoIcon from '@/public/icons/VideoIcon';
import { useGetUserCallsQuery } from '@/store/user/slice';
import { SessionFormState, Session } from '@/types';
import { CallMember } from '@/store/user/types';
import TokenGatingTooltip from './token-gating-tooltip';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateSession: (
        title: string,
        type: sessionType,
        scheduledDate?: Date,
        tokenGatedSessions?: string[]
    ) => void;
}

export const DEFAULT_SESSION_TITLE = 'Demo Session';

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
    isOpen,
    onClose,
    onCreateSession,
}) => {
    const [formState, setFormState] = useState<SessionFormState>({
        title: DEFAULT_SESSION_TITLE,
        type: sessionType.POD,
        isScheduled: false,
        date: undefined,
        time: undefined,
    });
    const [tokenGatingSwitch, setTokenGatingSwitch] = useState<boolean>(false);
    const [whitelistedAddresses, setWhitelistedAddresses] = useState<string[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [timeError, setTimeError] = useState('');
    const [isSelectingSession, setIsSelectingSession] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const { data: userCallsData, isLoading: isLoadingCalls } = useGetUserCallsQuery(
        { filter: 'tokengate' },
        {
            skip: !tokenGatingSwitch,
        }
    );

    const handleSessionSelectionChange = (sessions: Session[]) => {
        if (!userCallsData?.data?.calls) return;

        const selectedCallsData = userCallsData.data.calls.filter(call =>
            sessions.some(session => session.id === call.callId)
        );

        const allMemberAddresses = selectedCallsData.flatMap(call =>
            (call.members as CallMember[]).map(member => member.userId.id.toLowerCase())
        );

        const uniqueAddresses = Array.from(new Set(allMemberAddresses));

        setWhitelistedAddresses(uniqueAddresses);
    };

    const transformedSessions: Session[] = React.useMemo(() => {
        if (!userCallsData?.data?.calls) return [];

        return userCallsData.data.calls.map(call => ({
            id: call.callId,
            name: (call.custom?.title as string) || `Session ${call.callId}`,
            type: (call.custom?.type as string) || sessionType.POD,
            membersCount: call.members ? call.members.length : 0,
            startTime: call.startTime,
            whitelisted: false,
        }));
    }, [userCallsData]);

    const toggleTokengatingSwitch = () => {
        setTokenGatingSwitch(!tokenGatingSwitch);
    };

    const isDateTimeInPast = (date: Date, timeStr?: string): boolean => {
        if (!timeStr) return false;
        const [hours, minutes] = timeStr.split(':').map(Number);
        const dateWithTime = new Date(date);
        dateWithTime.setHours(hours, minutes, 0, 0);
        return isBefore(dateWithTime, new Date());
    };

    const handleCreateSession = useCallback(async () => {
        if (!formState.title.trim()) return;
        if (formState.isScheduled && timeError) return;

        setIsCreating(true);
        try {
            let scheduledDate: Date | undefined;

            if (formState.isScheduled && formState.date && formState.time) {
                const [hours, minutes = 0] = formState.time.split(':').map(Number);
                scheduledDate = new Date(formState.date);
                scheduledDate.setHours(hours, minutes, 0, 0);
            }

            const addresses = tokenGatingSwitch ? whitelistedAddresses : undefined;

            await onCreateSession(formState.title, formState.type, scheduledDate, addresses);
            onClose();
        } finally {
            setIsCreating(false);
        }
    }, [formState, onCreateSession, onClose, timeError, tokenGatingSwitch, whitelistedAddresses]);

    const updateFormState = useCallback((updates: Partial<SessionFormState>) => {
        setFormState(prev => ({ ...prev, ...updates }));
    }, []);

    const isSubmitDisabled = formState.isScheduled
        ? !formState.title.trim() || !formState.date || !formState.time || isCreating || !!timeError
        : !formState.title.trim() || isCreating;

    const getWhitelistSummary = () => {
        if (!tokenGatingSwitch) return null;
        if (whitelistedAddresses.length === 0) return null;

        return (
            <div className="text-sm text-white/70 px-4">
                {whitelistedAddresses.length} unique{' '}
                {whitelistedAddresses.length === 1 ? 'address' : 'addresses'} will be whitelisted
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`
                bg-[#1d1d1d] text-white rounded-[20px] sm:rounded-[20px] p-4 sm:p-8 
                w-full max-w-[90%] sm:max-w-lg mx-auto 
                overflow-hidden max-h-[90vh] border border-white/[0.1]
            `}
            >
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
                        '[mask-image:radial-gradient(to_bottom_right,#3B3B3B,transparent,transparent)] rounded-[20px] top-[6px] left-[8px] px-[10px] -z-10'
                    )}
                />
                <DialogHeader className="flex flex-row justify-between items-center mb-6">
                    <DialogTitle className="text-2xl font-semibold text-[#d4d4d4]">
                        Create session
                    </DialogTitle>
                </DialogHeader>

                <div className="flex items-center gap-4 mb-6">
                    <Button
                        size="sm"
                        className={`rounded-full ${
                            !formState.isScheduled
                                ? 'bg-[#6032F6] hover:bg-[#6D28D9]'
                                : 'bg-[#1e1e1e] border border-zinc-600'
                        }`}
                        onClick={() => updateFormState({ isScheduled: false })}
                    >
                        Instant session
                    </Button>
                    <Button
                        size="sm"
                        className={`rounded-full ${
                            formState.isScheduled
                                ? 'bg-[#6032F6] hover:bg-[#6D28D9]'
                                : 'bg-[#1e1e1e] border border-zinc-600'
                        }`}
                        onClick={() => updateFormState({ isScheduled: true })}
                    >
                        Schedule session{' '}
                        <span className="text-yellow-300 rounded-full px-1 text-xs bg-yellow-700">
                            New
                        </span>
                    </Button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-[#A3A3A3] mb-2">Session title</label>
                        <Input
                            value={formState.title}
                            onChange={e => updateFormState({ title: e.target.value })}
                            className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] whitespace-nowrap"
                        />
                    </div>

                    <div>
                        <label className="block text-[#A3A3A3] mb-2">Session type</label>
                        <Select
                            value={formState.type}
                            onValueChange={(value: sessionType) => updateFormState({ type: value })}
                        >
                            <SelectTrigger className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c]">
                                <SelectValue>
                                    <div className="flex items-center gap-[8px]">
                                        {formState.type === sessionType.AUDIO && (
                                            <div className="flex justify-center items-center w-[20px] h-[20px] bg-[#6032F6] rounded-full">
                                                <div className="icon-container w-[12px] h-[12px]">
                                                    <Microphone />
                                                </div>
                                            </div>
                                        )}
                                        {formState.type === sessionType.POD && (
                                            <div className="flex justify-center items-center w-[20px] h-[20px] bg-[#6032F6] rounded-full">
                                                <div className="icon-container w-[12px] h-[12px]">
                                                    <VideoIcon />
                                                </div>
                                            </div>
                                        )}
                                        <span>{formState.type}</span>
                                    </div>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#2C2C2C] text-white">
                                <SelectItem value={sessionType.AUDIO}>
                                    <div className="flex items-center gap-[8px]">
                                        <div className="flex justify-center items-center w-[20px] h-[20px] bg-[#6032F6] rounded-full">
                                            <div className="icon-container w-[12px] h-[12px]">
                                                <Microphone />
                                            </div>
                                        </div>
                                        <span> Audio Session</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value={sessionType.POD}>
                                    <div className="flex items-center gap-[8px]">
                                        <div className="flex justify-center items-center w-[20px] h-[20px] bg-[#6032F6] rounded-full">
                                            <div className="icon-container w-[12px] h-[12px]">
                                                <VideoIcon />
                                            </div>
                                        </div>
                                        <span>Pod Session</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formState.isScheduled && (
                        <div>
                            <label className="block text-[#A3A3A3] mb-2">Date and time</label>
                            <div className="grid grid-cols-2 gap-4">
                                <Popover
                                    open={isCalendarOpen}
                                    onOpenChange={setIsCalendarOpen}
                                    modal
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c] hover:bg-[#3c3c3c]"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4 text-[#6032F6]" />
                                            {formState.date
                                                ? format(formState.date, 'PPP')
                                                : 'Pick a date'}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0 bg-[#2C2C2C]"
                                        align="start"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={formState.date}
                                            onSelect={date => {
                                                updateFormState({ date });
                                                setIsCalendarOpen(false);
                                                setTimeError('');
                                            }}
                                            disabled={date =>
                                                isBefore(date, startOfDay(new Date())) ||
                                                date > addDays(new Date(), 30)
                                            }
                                            className="bg-[#2C2C2C] text-white"
                                        />
                                    </PopoverContent>
                                </Popover>

                                <SimpleTimePicker
                                    value={formState.time || ''}
                                    onChange={newTime => {
                                        if (
                                            formState.date &&
                                            isDateTimeInPast(formState.date, newTime)
                                        ) {
                                            setTimeError('Cannot schedule for a past time');
                                            return;
                                        }
                                        updateFormState({ time: newTime });
                                        setTimeError('');
                                    }}
                                    error={timeError}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-white/70">Token Gating</span>
                            <TokenGatingTooltip />
                        </div>
                        <Button
                            className="flex bg-[#2B2B2B] p-[2px] rounded-3xl"
                            onClick={toggleTokengatingSwitch}
                        >
                            <div className="flex items-center gap-[8px]">
                                <span
                                    className={`${!tokenGatingSwitch ? 'bg-[#3c3c3c] w-[20px] h-[20px] rounded-full flex items-center justify-center' : 'p-[4px]'} `}
                                >
                                    <div className="w-[12px] h-[12px] rounded-full">
                                        <CloseCircle
                                            color={`${!tokenGatingSwitch ? 'stroke-[#ADADAD]' : 'stroke-[#515151]'}`}
                                        />
                                    </div>
                                </span>
                                <span
                                    className={`${tokenGatingSwitch ? 'bg-gradient-to-t from-[#6A42E2] to-[#D7B260]' : ''}  w-[20px] h-[20px] rounded-full flex items-center justify-center`}
                                >
                                    <div className="w-[12px] h-[12px] rounded-full">
                                        <TickCircle
                                            color={`${tokenGatingSwitch ? 'stroke-white' : 'stroke-[#515151]'}`}
                                        />
                                    </div>
                                </span>
                            </div>
                        </Button>
                    </div>

                    {getWhitelistSummary()}

                    {tokenGatingSwitch &&
                        (isLoadingCalls ? (
                            <div className="flex justify-center items-center p-4">
                                <span className="text-white/70">Loading previous sessions...</span>
                            </div>
                        ) : (
                            <MultiSelect
                                sessions={transformedSessions}
                                isLoading={isLoadingCalls}
                                onSelectionChange={handleSessionSelectionChange}
                            />
                        ))}

                    <div className="flex justify-between items-center gap-6 pt-3">
                        <Button
                            onClick={onClose}
                            className="w-1/2 px-3 py-3 rounded-[10px] bg-[#2C2C2C] hover:bg-[#3C3C3C]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            disabled={isSubmitDisabled}
                            className="w-1/2 px-3 py-3 rounded-[10px] bg-[#6032F6] hover:bg-[#6D28D9] disabled:bg-gray-500"
                        >
                            {isCreating ? 'Creating...' : 'Create session'}
                        </Button>
                    </div>
                </div>

                {tokenGatingSwitch && isSelectingSession && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-6">
                            <Button
                                onClick={() => setIsSelectingSession(false)}
                                className="text-gray-400 hover:text-white flex items-center gap-2"
                                variant="ghost"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Back
                            </Button>
                            <h3 className="text-lg font-medium text-white">Select Sessions</h3>
                        </div>

                        {isLoadingCalls ? (
                            <div className="flex justify-center items-center p-4">
                                <span className="text-white/70">Loading previous sessions...</span>
                            </div>
                        ) : (
                            <MultiSelect
                                sessions={transformedSessions}
                                isLoading={isLoadingCalls}
                                onSelectionChange={handleSessionSelectionChange}
                            />
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default React.memo(CreateSessionModal);
