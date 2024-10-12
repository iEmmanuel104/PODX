import React from "react";
import { useCallStateHooks } from "@stream-io/video-react-sdk";
import { Mic, MicOff } from "lucide-react";

const ToggleAudioButton = () => {
    const { useMicrophoneState } = useCallStateHooks();
    const { microphone, isMute } = useMicrophoneState();

    const toggleMicrophone = async () => {
        try {
            await microphone.toggle();
        } catch (error) {
            console.error("Error toggling microphone:", error);
        }
    };

    return (
        <button
            title={isMute ? "Turn on microphone" : "Turn off microphone"}
            className={`p-3 rounded-full ${isMute ? "bg-red-500" : "bg-[#2C2C2C]"} hover:bg-opacity-80 transition-colors`}
            onClick={toggleMicrophone}
        >
            {isMute ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
    );
};

export default ToggleAudioButton;
