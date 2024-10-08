import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Mic, Volume2 } from "lucide-react";

const VideoPreview: React.FC = () => {
    const [isMuted, setIsMuted] = useState(true);

    return (
        <div className="w-full max-w-md mb-8">
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
                <div className="relative aspect-video">
                    <img src="/images/video-placeholder.jpg" alt="Video preview" className="w-full h-full object-cover" />
                    {isMuted && <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-1 px-2 rounded-full">Muted</div>}
                </div>
                <div className="flex justify-center p-2 gap-2">
                    <Button variant="outline" size="icon">
                        <Camera className="w-4 h-4" />
                    </Button>
                    <Button variant={isMuted ? "destructive" : "outline"} size="icon" onClick={() => setIsMuted(!isMuted)}>
                        <Mic className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Volume2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreview;
