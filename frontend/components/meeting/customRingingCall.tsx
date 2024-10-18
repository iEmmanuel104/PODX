import React, { useEffect } from "react";
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
    [CallingState.RINGING]: "Ringing",
    [CallingState.RECONNECTING]: "Re-connecting",
    [CallingState.RECONNECTING_FAILED]: "Failed",
    [CallingState.OFFLINE]: "No internet connection",
    [CallingState.IDLE]: "",
    [CallingState.UNKNOWN]: "",
    [CallingState.JOINED]: "Joined",
    [CallingState.LEFT]: "Left call",
    [CallingState.MIGRATING]: ""
};

export const CustomRingingCall: React.FC<RingingCallProps> = ({ showMemberCount = 3 }) => {
    const call = useCall();
    const { useCallMembers, useCallCreatedBy, useCameraState, useCallCallingState, useMicrophoneState } = useCallStateHooks();
    const { t } = useI18n();

    const members = useCallMembers();
    const creator = useCallCreatedBy();
    const callingState = useCallCallingState();
    const { camera, isMute: isCameraMute } = useCameraState();
    const { microphone, isMute: isAudioMute } = useMicrophoneState();

    useEffect(() => {
        // enable the camera by default for all ring calls
        camera.enable();
    }, [camera]);

    if (!call) return null;

    const caller = creator;
    // show the caller if this is an incoming call or show all the users I am calling to
    let membersToShow: UserResponse[] = [];
    if (call.isCreatedByMe) {
        membersToShow =
            members
                ?.slice(0, showMemberCount)
                .map(({ user }) => user)
                .filter((u): u is UserResponse => !!u) || [];
    } else if (caller) {
        membersToShow = [caller];
    }

    const CallMembers: React.FC<{ members: UserResponse[] }> = ({ members }) => {
        return (
            <div className="flex justify-center space-x-2">
                {members.map((member) => (
                    <div key={member.id} className="text-center">
                        <Avatar name={member.name} imageSrc={member.image} sizes="64" />
                        {member.name && (
                            <div className="mt-2">
                                <span className="text-sm text-white">{member.name}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const CallCallingStateLabel: React.FC = () => {
        const callingStateLabel = CALLING_STATE_TO_LABEL[callingState];
        return callingStateLabel ? <div className="text-[#AFAFAF] text-center mt-4">{t(callingStateLabel)}</div> : null;
    };

    const CallControls: React.FC = () => {
        if (![CallingState.RINGING, CallingState.JOINING].includes(callingState)) return null;

        const buttonsDisabled = callingState === CallingState.JOINING;

        return (
            <div className="flex justify-center space-x-4 mt-6">
                <IconButton icon={isAudioMute ? "mic-off" : "mic"} onClick={() => microphone.toggle()} />
                <IconButton icon={isCameraMute ? "camera-off" : "camera"} onClick={() => camera.toggle()} />
                {call.isCreatedByMe ? (
                    <CancelCallButton disabled={buttonsDisabled} />
                ) : (
                    <>
                        <AcceptCallButton disabled={buttonsDisabled} />
                        <CancelCallButton onClick={() => call.leave({ reject: true })} disabled={buttonsDisabled} />
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-[#1E1E1E] p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">{call.isCreatedByMe ? "Outgoing Call" : "Incoming Call"}</h2>
                {isCameraMute ? (
                    <CallMembers members={membersToShow} />
                ) : (
                    <div className="w-full h-48 bg-gray-800 rounded-lg overflow-hidden">
                        <VideoPreview />
                    </div>
                )}
                <CallCallingStateLabel />
                <CallControls />
            </div>
        </div>
    );
};

export default CustomRingingCall;
