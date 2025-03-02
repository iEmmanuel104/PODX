import React from 'react';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ParticipantMenuDropdownProps {
    participant: StreamVideoParticipant;
    trigger: React.ReactNode;
}

export const ParticipantMenuDropdown = ({ participant, trigger }: ParticipantMenuDropdownProps) => {
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
                    <DropdownMenu.Item className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md">
                        Pin participant
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="text-white text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md">
                        View profile
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="text-[#FF3B30] text-sm px-3 py-2 outline-none cursor-pointer hover:bg-[#3D3D3D] rounded-md">
                        Remove participant
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};