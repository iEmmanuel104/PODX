import localFont from 'next/font/local';

export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string;

export const SERVER_SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_SOCKET_URL as string;

console.log({ SERVER_URL, SERVER_SOCKET_URL });

export const SIGNATURE_MESSAGE = process.env.NEXT_PUBLIC_SIGNATURE_MESSAGE as string;

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;

export const PRIVY_CLIENT_ID = process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID as string;

export const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export const STREAM_API_SECRET = process.env.NEXT_PUBLIC_STREAM_API_SECRET as string;

export enum sessionType {
    POD = 'Pod Session',
    AUDIO = 'Audio Session',
    // LIVE = 'Live Session'
}

export const streamCallType = {
    [sessionType.POD]: 'default',
    [sessionType.AUDIO]: 'audio_room',
    // [sessionType.LIVE]: 'livestream'
} as const;

export const clashGrotesk = localFont({
    src: [
        {
            path: '../app/fonts/clashGrotesk/regular.ttf',
            weight: '400',
            style: 'normal',
        },
        {
            path: '../app/fonts/clashGrotesk/medium.ttf',
            weight: '500',
            style: 'normal',
        },
        {
            path: '../app/fonts/clashGrotesk/bold.ttf',
            weight: '700',
            style: 'normal',
        },
    ],
});
