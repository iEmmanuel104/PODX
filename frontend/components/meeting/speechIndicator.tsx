import React from "react";
import Image from "next/image";
import clsx from "clsx";

interface SpeechIndicatorProps {
    isSpeaking: boolean;
    isDominantSpeaker?: boolean;
    isMicrophoneEnabled: boolean;
}

const SpeechIndicator: React.FC<SpeechIndicatorProps> = ({ isSpeaking, isDominantSpeaker = true, isMicrophoneEnabled }) => {
    return (
        <div
            className={clsx(
                "w-6 h-6 flex items-center justify-center rounded-full",
                isSpeaking && isMicrophoneEnabled ? "bg-[#6032F6]" : "bg-transparent",
                isDominantSpeaker && "ring-2 ring-transparent"
            )}
        >
            {isMicrophoneEnabled ? (
                <Image
                    src="/images/speaking.svg"
                    alt="Speaking"
                    width={16}
                    height={16}
                    className={clsx(
                        "transition-opacity duration-200",
                        isSpeaking ? "opacity-100" : "opacity-0"
                    )}
                />
            ) : (
                <Image
                    src="/images/muted.svg"
                    alt="Muted"
                    width={16}
                    height={16}
                    className="opacity-100"
                />
            )}
        </div>
    );
};

export default SpeechIndicator;