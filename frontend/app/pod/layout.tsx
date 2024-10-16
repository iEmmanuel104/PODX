"use client";
import { ReactNode, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import MeetProvider from "@/providers/meetProvider";
import { Suspense } from "react";

type LayoutProps = {
    children: ReactNode;
    params: {
        id: string;
    };
};

function LayoutContent({ children, params }: LayoutProps) {
    const searchParams = useSearchParams();
    const { id } = useParams();

    const meetingId = (id as string) || params.id || searchParams.get("code") || "";

    console.log({ LayoutFile: meetingId });

    if (!meetingId) {
        return null; // or a loading indicator
    }

    return <MeetProvider meetingId={meetingId}>{children}</MeetProvider>;
}

export default function Layout(props: LayoutProps) {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LayoutContent {...props} />
        </Suspense>
    );
}

export const dynamic = "force-dynamic";
