import React from 'react';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCall } from '@stream-io/video-react-sdk';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { OwnCapability } from '@stream-io/video-react-sdk';
import { useParticipantActions } from './useParticipantActions';
import { BadgeDollarSign, Mic, MicOff, Video, VideoOff, Monitor, ScreenShareOff, LogOut } from 'lucide-react';

interface ParticipantMenuDropdownProps {
    participant: StreamVideoParticipant;
    trigger: React.ReactNode;
}

export const ParticipantMenuDropdown = ({ participant, trigger }: ParticipantMenuDropdownProps) => {
    const call = useCall();
    const { useHasPermissions } = useCallStateHooks();
    const canUpdatePermissions = useHasPermissions(OwnCapability.UPDATE_CALL_PERMISSIONS);
    
    const {
        isHost,
        isLocalUser,
        canSendAudio,
        canSendVideo,
        canScreenShare,
        toggleAudioPermission,
        toggleVideoPermission,
        toggleScreenSharePermission,
        removeParticipant,
        requestAudioPermission
    } = useParticipantActions(participant);

    // Check if the participant is a host
    const isParticipantHost = participant.roles?.includes('host') || false;

    // Handle tipping a user
    const handleTipUser = () => {
        // Implement tip functionality
        console.debug(`Tipping user: ${participant.userId}`);
    };

    // If this is the local user, don't show the menu
    if (isLocalUser) {
        return null;
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                {trigger}
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[180px] bg-[#2A2A2A] rounded-lg p-1 shadow-lg"
                    sideOffset={5}
                >
                    {/* Common action for all cases: Tip User */}
                    <DropdownMenu.Item 
                        className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md flex items-center gap-2"
                        onClick={handleTipUser}
                    >
                        <BadgeDollarSign className="h-4 w-4" />
                        Tip {participant.name || participant.userId}
                    </DropdownMenu.Item>

                    {/* CASE 1: Host looking at a User */}
                    {isHost && !isParticipantHost && (
                        <>
                            <DropdownMenu.Item 
                                className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md flex items-center gap-2"
                                onClick={toggleAudioPermission}
                            >
                                {canSendAudio ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                {canSendAudio ? 'Disable Audio' : 'Enable Audio'}
                            </DropdownMenu.Item>
                            
                            <DropdownMenu.Item 
                                className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md flex items-center gap-2"
                                onClick={toggleVideoPermission}
                            >
                                {canSendVideo ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                                {canSendVideo ? 'Freeze Video' : 'Grant Camera Access'}
                            </DropdownMenu.Item>
                            
                            <DropdownMenu.Item 
                                className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md flex items-center gap-2"
                                onClick={toggleScreenSharePermission}
                            >
                                {canScreenShare ? <ScreenShareOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                                {canScreenShare ? 'Disable Screensharing' : 'Allow Screensharing'}
                            </DropdownMenu.Item>
                            
                            <DropdownMenu.Item 
                                className="text-[#FF3B30] text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md flex items-center gap-2"
                                onClick={removeParticipant}
                            >
                                <LogOut className="h-4 w-4" />
                                Kick {participant.name || participant.userId}
                            </DropdownMenu.Item>
                        </>
                    )}

                    {/* CASE 2: User looking at a Host */}
                    {!isHost && isParticipantHost && (
                        <>
                            {!canSendAudio && (
                                <DropdownMenu.Item 
                                    className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md flex items-center gap-2"
                                    onClick={requestAudioPermission}
                                >
                                    <Mic className="h-4 w-4" />
                                    Request Mic
                                </DropdownMenu.Item>
                            )}
                        </>
                    )}

                    {/* CASE 3: User looking at another User - only tipping is allowed */}
                    {/* No additional actions for users looking at other users */}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};