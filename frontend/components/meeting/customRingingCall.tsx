import React from "react";
import {
    useCall,
    useCallStateHooks,
    VideoPreview,
    UserResponse,
    CallingState,
    AcceptCallButton,
    CancelCallButton,
    IconButton,
    Avatar,
    useI18n,
} from "@stream-io/video-react-sdk";

type RingingCallProps = {
    showMemberCount?: number;
};

const CALLING_STATE_TO_LABEL: Record<CallingState, string> = {
    [CallingState.JOINING]: "Joining",
    [CallingState.RINGING]: "Incoming call",
    [CallingState.RECONNECTING]: "Re-connecting",
    [CallingState.RECONNECTING_FAILED]: "Failed",
    [CallingState.OFFLINE]: "No internet connection",
    [CallingState.IDLE]: "",
    [CallingState.UNKNOWN]: "",
    [CallingState.JOINED]: "Joined",
    [CallingState.LEFT]: "Left call",
    [CallingState.MIGRATING]: "",
};

export const CustomRingingCall: React.FC<RingingCallProps> = ({ showMemberCount = 1 }) => {
    const call = useCall();
    const { useCallCreatedBy, useCameraState, useCallCallingState, useMicrophoneState } = useCallStateHooks();
    const { t } = useI18n();

    const creator: UserResponse | null = useCallCreatedBy() ?? null;
    const callingState = useCallCallingState();
    const { camera, isMute: isCameraMute } = useCameraState();
    const { microphone, isMute: isAudioMute } = useMicrophoneState();

    if (!call || call.isCreatedByMe || callingState !== CallingState.RINGING) return null;

    const CallMembers: React.FC<{ member: UserResponse | null }> = ({ member }) => {
        if (!member) return null;
        return (
            <div className="flex justify-center">
                <div className="text-center">
                    <Avatar name={member.name} imageSrc={member.image} sizes="64" />
                    {member.name && (
                        <div className="mt-2">
                            <span className="text-sm text-white">{member.name}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const CallCallingStateLabel: React.FC = () => {
        const callingStateLabel = CALLING_STATE_TO_LABEL[callingState];
        return callingStateLabel ? <div className="text-[#AFAFAF] text-center mt-4">{t(callingStateLabel)}</div> : null;
    };

    const CallControls: React.FC = () => {
        return (
            <div className="flex justify-center space-x-4 mt-6">
                <CancelCallButton onClick={() => call.leave({ reject: true })} />
                <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">Decline</button>
                <AcceptCallButton />
                <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">Accept</button>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Incoming Call</h2>
                <CallMembers member={creator} />
                <CallCallingStateLabel />
                <CallControls />
            </div>
        </div>
    );
};

export default CustomRingingCall;
