"use client";
import { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import MeetProvider from "@/providers/meetProvider";

type LayoutProps = {
    children: ReactNode;
    params: {
        meetingId?: string;
    };
};

export default function Layout({ children, params }: LayoutProps) {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");
    const meetingId = params.meetingId || code || "";

    return <MeetProvider meetingId={meetingId}>{children}</MeetProvider>;
}
