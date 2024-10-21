"use client";
import React, { useState } from "react";
import Image from "next/image";
interface VideoPreviewProps {
    isMuted: boolean;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ isMuted }) => (
    <div className="bg-[#1E1E1E] rounded-lg overflow-hidden mb-6">
        <div className="relative aspect-video">
            <Image
                src="/images/woman.png"
                alt="Video preview"
                className="w-full h-full object-cover"
            />
            {isMuted ? (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-1 px-2 rounded-full flex items-center">
                    Muted
                </div>
            ) : (
                <div className="absolute top-2 left-2 bg-[#6032F6] text-white text-xs py-1 px-2 rounded-full flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                    Speaking...
                </div>
            )}
        </div>
    </div>
)


export default VideoPreview;
