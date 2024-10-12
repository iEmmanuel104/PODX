"use client";
import { ReactNode, useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import MeetProvider from "@/providers/meetProvider";

type LayoutProps = {
    children: ReactNode;
    params: {
        id: string;
    };
};

export default function Layout({ children, params }: LayoutProps) {
    const searchParams = useSearchParams();
    const { id } = useParams();

    const meetingId = useMemo(() => {
        const code = searchParams.get("code");
        return (id as string) || params.id || code || "";
    }, [id, params.id, searchParams]);

    console.log({ LayoutFile: meetingId });

    if (!meetingId) {
        return null; // or a loading indicator
    }

    return <MeetProvider meetingId={meetingId}>{children}</MeetProvider>;
}
