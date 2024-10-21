export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL as string;

export const SERVER_SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_SOCKET_URL as string;

console.log({ SERVER_URL, SERVER_SOCKET_URL });

export const SIGNATURE_MESSAGE = process.env.NEXT_PUBLIC_SIGNATURE_MESSAGE as string;

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string;

export const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY as string;

export const STREAM_API_SECRET = process.env.NEXT_PUBLIC_STREAM_API_SECRET as string;