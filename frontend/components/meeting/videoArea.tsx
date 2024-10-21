import React from "react";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";
import Image from "next/image";

interface VideoAreaProps {
    currentSpeaker: string;
    onTip: (recipient: string) => void;
}

const VideoArea: React.FC<VideoAreaProps> = ({ currentSpeaker, onTip }) => {
    return (
        <div className="h-full relative bg-gray-800 rounded-lg overflow-hidden">
            <Image src="/images/video-placeholder.jpg" alt="Current speaker" className="w-full h-full object-cover" />
            <div className="absolute top-2 left-2 bg-purple-600 text-white text-xs py-1 px-2 rounded-full">Speaking</div>
            <Button variant="outline" size="sm" className="absolute bottom-4 right-4" onClick={() => onTip(currentSpeaker)}>
                <DollarSign className="w-4 h-4 mr-2" />
                Tip
            </Button>
        </div>
    );
};

export default VideoArea;
