import { OwnCapability } from '@stream-io/video-react-sdk';

export enum StreamRole {
    USER = 'user',
    MODERATOR = 'moderator',
    HOST = 'host',
    ADMIN = 'admin',
    CALL_MEMBER = 'call-member'
}

export const roleCapabilities = {
    [StreamRole.HOST]: [
        OwnCapability.SEND_AUDIO,
        OwnCapability.SEND_VIDEO,
        OwnCapability.SCREENSHARE,
        OwnCapability.UPDATE_CALL_PERMISSIONS,
        OwnCapability.MUTE_USERS,
        OwnCapability.END_CALL,
        OwnCapability.REMOVE_CALL_MEMBER,
        OwnCapability.PIN_FOR_EVERYONE
    ],
    [StreamRole.MODERATOR]: [
        OwnCapability.SEND_AUDIO,
        OwnCapability.SEND_VIDEO,
        OwnCapability.SCREENSHARE,
        OwnCapability.MUTE_USERS,
        OwnCapability.REMOVE_CALL_MEMBER
    ],
    [StreamRole.USER]: [
        OwnCapability.SEND_AUDIO,
        OwnCapability.SEND_VIDEO,
        OwnCapability.SCREENSHARE
    ],
    [StreamRole.CALL_MEMBER]: [
        OwnCapability.JOIN_CALL,
        OwnCapability.CREATE_REACTION
    ]
};

export const isHost = (role?: string): boolean => role === StreamRole.HOST;
export const isModerator = (role?: string): boolean => role === StreamRole.MODERATOR;
export const isUser = (role?: string): boolean => role === StreamRole.USER;
export const isCallMember = (role?: string): boolean => role === StreamRole.CALL_MEMBER;