"use client";
import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { useSearchParams } from "next/navigation";
import MeetProvider from "@/providers/meetProvider";

type LayoutProps = {
    children: ReactNode;
    params: {
        id: string;
    };
};

export default function Layout({ children, params }: LayoutProps) {
    const searchParams = useSearchParams();
    const code = searchParams.get("code");

    const { id } = useParams();
    const meetingId = id as string || params.id || code || "";

    console.log({ meetingId });

    return <MeetProvider meetingId={meetingId}>{children}</MeetProvider>;
}
