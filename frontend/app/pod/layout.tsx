"use client";
import { ReactNode } from "react";

import MeetProvider from "@/providers/meetProvider";

type LayoutProps = {
    children: ReactNode;
    params: {
        meetingId: string;
    };
};

export default function Layout({ children, params }: LayoutProps) {
    return <MeetProvider meetingId={params.meetingId}>{children}</MeetProvider>;
}
