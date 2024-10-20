"use client";
import { ReactNode } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import MeetProvider from "@/providers/meetProvider";
import { Suspense } from "react";
import { LoadingOverlay } from "@/components/ui/loading";

type LayoutProps = {
    children: ReactNode;
    params: {
        id?: string;
    };
};

function LayoutContent({ children, params }: LayoutProps) {
    const { id } = useParams();
    const router = useRouter();
    const pathname = usePathname();

    // Use the ID from params if available, otherwise it will be undefined
    const meetingId = id as string | undefined;

    console.log({ LayoutFile: meetingId, pathname });

    // Validate meetingId format if it exists
    const isValidMeetingId = meetingId ? /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingId) : true;

    // If we're not already on the /pod page and there's no valid meeting ID, redirect to /pod
    if (pathname !== "/pod" && !isValidMeetingId) {
        console.log("Redirecting to /pod since meetingId is invalid");
        router.push("/pod");
        return null; // Return null to prevent rendering while redirecting
    }

    // If there's an invalid meeting ID, render without it
    if (meetingId && !isValidMeetingId) {
        console.error("Invalid meeting ID format");
        return <MeetProvider>{children}</MeetProvider>;
    }

    return <MeetProvider meetingId={meetingId}>{children}</MeetProvider>;
}

export default function Layout(props: LayoutProps) {
    return (
        <Suspense fallback={<div className="h-screen w-screen bg-[#121212]"><LoadingOverlay text="Preparing your session..." /> </div>}>
            <LayoutContent {...props} />
        </Suspense>
    );
}

export const dynamic = "force-dynamic";
