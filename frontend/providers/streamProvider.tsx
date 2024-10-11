// import React from "react";
// import { StreamVideo, StreamVideoClient } from "@stream-io/video-react-sdk";
// import { StreamChat } from "stream-chat";
// import { Chat } from "stream-chat-react";
// import { useAppSelector } from "@/store/hooks";

// const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// const StreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const { user } = useAppSelector((state) => state.user);

//     if (!user || !user.streamToken) {
//         return <>{children}</>;
//     }

//     const videoClient = new StreamVideoClient({ apiKey, user: { id: user.id }, token: user.streamToken });
//     const chatClient = new StreamChat(apiKey);
//     chatClient.connectUser({ id: user.id }, user.streamToken);

//     return (
//         <StreamVideo client={videoClient}>
//             <Chat client={chatClient}>{children}</Chat>
//         </StreamVideo>
//     );
// };

// export default StreamProvider;
