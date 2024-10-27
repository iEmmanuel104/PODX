"use client";
import dynamic from "next/dynamic";
import { memo, type ReactNode } from "react";

export const DynamicStreamVideo = dynamic(() => import("@stream-io/video-react-sdk").then((mod) => mod.StreamVideo), { ssr: false });

export const DynamicStreamCall = dynamic(() => import("@stream-io/video-react-sdk").then((mod) => mod.StreamCall), { ssr: false });

export const DynamicChat = dynamic(() => import("stream-chat-react").then((mod) => mod.Chat), { ssr: false });

export const SimpleMeetProvider = memo<{ children: ReactNode }>(({ children }) => <div className="w-full h-full">{children}</div>);
SimpleMeetProvider.displayName = "SimpleMeetProvider";
