import React from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Video, VideoOff } from "lucide-react";

const ToggleVideoButton = () => {
    const { useCameraState } = useCallStateHooks();
    const { camera, isMute } = useCameraState();

    const toggleCamera = async () => {
        try {
            await camera.toggle();
        } catch (error) {
            console.error("Error toggling camera:", error);
        }
    };

    return (
        <button
            title={isMute ? "Turn on camera" : "Turn off camera"}
            className={`p-3 rounded-full ${isMute ? "bg-red-500" : "bg-[#2C2C2C]"} hover:bg-opacity-80 transition-colors`}
            onClick={toggleCamera}
        >
            {isMute ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>
    );
};

export default ToggleVideoButton;
