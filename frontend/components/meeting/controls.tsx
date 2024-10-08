import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, Video, PhoneOff } from "lucide-react";

interface ControlsProps {
    isMuted: boolean;
    isVideoOn: boolean;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onLeave: () => void;
}

const Controls: React.FC<ControlsProps> = ({ isMuted, isVideoOn, onToggleMute, onToggleVideo, onLeave }) => {
    return (
        <div className="bg-gray-800 p-4 flex justify-center items-center gap-4">
            <Button variant={isMuted ? "destructive" : "secondary"} size="icon" onClick={onToggleMute}>
                <Mic className="w-6 h-6" />
            </Button>
            <Button variant={isVideoOn ? "secondary" : "destructive"} size="icon" onClick={onToggleVideo}>
                <Video className="w-6 h-6" />
            </Button>
            <Button variant="destructive" onClick={onLeave}>
                <PhoneOff className="w-5 h-5 mr-2" />
                Leave
            </Button>
        </div>
    );
};

export default Controls;
