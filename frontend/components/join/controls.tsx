import React from 'react';
import { Mic, Volume2, ChevronDown, Video } from "lucide-react";

interface ControlsProps {
    isMuted: boolean;
    setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

const Controls: React.FC<ControlsProps> = ({ isMuted, setIsMuted }) => (
    <div className="flex justify-between px-2">
        <button className="bg-[#2C2C2C] hover:bg-[#3C3C3C] transition-colors px-4 py-3 rounded-full flex items-center">
            <Video className="w-5 h-5 mr-2" />
            <ChevronDown className="w-4 h-4" />
        </button>
        <button
            className={`${isMuted ? 'bg-red-500' : 'bg-[#2C2C2C]'} hover:bg-[#3C3C3C] transition-colors px-4 py-3 rounded-full flex items-center`}
            onClick={() => setIsMuted(!isMuted)}
        >
            <Mic className="w-5 h-5 mr-2" />
            <ChevronDown className="w-4 h-4" />
        </button>
        <button className="bg-[#2C2C2C] hover:bg-[#3C3C3C] transition-colors px-4 py-3 rounded-full flex items-center">
            <Volume2 className="w-5 h-5 mr-2" />
            <ChevronDown className="w-4 h-4" />
        </button>
    </div>
)

export default Controls;