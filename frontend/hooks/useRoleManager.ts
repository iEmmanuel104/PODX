import { useCallback } from 'react';
import { OwnCapability, useCallStateHooks } from '@stream-io/video-react-sdk';
import { StreamRole } from '@/lib/roles/config';

export const useRoleManager = (userRole?: StreamRole) => {
    const { useHasPermissions } = useCallStateHooks();

    return {
        isHost: userRole === StreamRole.HOST,
        isModerator: userRole === StreamRole.MODERATOR,
        isUser: userRole === StreamRole.USER,
        isCallMember: userRole === StreamRole.CALL_MEMBER,
        canSendAudio: useHasPermissions(OwnCapability.SEND_AUDIO),
        canSendVideo: useHasPermissions(OwnCapability.SEND_VIDEO),
        canScreenShare: useHasPermissions(OwnCapability.SCREENSHARE),
        canManageCall: useHasPermissions(OwnCapability.UPDATE_CALL_PERMISSIONS)
    };
};