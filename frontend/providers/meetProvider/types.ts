import type { ReactNode } from 'react';

export type MeetProviderProps = {
    meetingId?: string;
    children: ReactNode;
    language?: string;
};

export type StreamMeetProviderProps = {
    meetingId: string;
    children: ReactNode;
    language: string;
};
