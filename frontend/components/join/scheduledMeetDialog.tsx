import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, User, Clock, Tag } from "lucide-react";
import { format } from "date-fns";

interface ScheduledMeetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sessionTitle: string;
    startTime: string;
    creator?: {
        id: string;
        name: string;
        username: string;
    };
    type?: string;
    sessionId?: string;
    createdAt?: string;
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div className="flex items-center gap-3 text-sm">
        <Icon className="w-4 h-4 text-[#6032F6]" />
        <span className="text-[#A3A3A3]">{label}:</span>
        <span className="text-white">{value}</span>
    </div>
);

const ScheduledMeetDialog = ({
    isOpen,
    onClose,
    sessionTitle,
    startTime,
    creator,
    type,
    sessionId,
    createdAt,
}: ScheduledMeetDialogProps) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-[10px] p-6 w-full max-w-md border-[#2C2C2C]">
                <DialogHeader>
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center mb-4 mx-auto">
                        <Calendar className="w-5 h-5 text-[#6032F6]" />
                    </div>
                    <DialogTitle className="text-xl font-semibold text-center mb-4">Scheduled Meeting</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Meeting Title and Start Time */}
                    <div className="text-center">
                        <p className="text-[#A3A3A3] text-sm mb-2">The meeting you're trying to join is scheduled for:</p>
                        <p className="text-lg font-medium mb-1">{sessionTitle}</p>
                        <p className="text-[#6032F6] font-medium">{format(new Date(startTime), "PPP 'at' p")}</p>
                    </div>

                    {/* Meeting Details */}
                    <div className="bg-[#2C2C2C] p-4 rounded-lg space-y-3">
                        {/* Creator Info */}
                        {creator && <InfoRow icon={User} label="Host" value={creator.username || creator.name} />}

                        {/* Meeting Type */}
                        {type && <InfoRow icon={Tag} label="Type" value={type} />}

                        {/* Created At */}
                        {createdAt && <InfoRow icon={Clock} label="Created" value={format(new Date(createdAt), "MMM d, yyyy")} />}

                        {/* Meeting ID */}
                        {sessionId && <div className="text-xs text-[#A3A3A3] mt-2">Meeting ID: {sessionId}</div>}
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={onClose}
                            className="w-full bg-[#6032F6] hover:bg-[#4C28C4] text-white 
                                     rounded-[10px] py-2 px-4 transition-colors duration-200"
                        >
                            Back to Pod
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ScheduledMeetDialog;
