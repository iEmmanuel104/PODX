"use client";
import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { DynamicOptions, Loader } from "next/dynamic";
import { default as dynamicImport } from "next/dynamic";
import { LoadingOverlay } from "@/components/ui/loading";

// Define the props type for MeetProvider
type MeetProviderProps = {
    meetingId?: string;
    children: ReactNode;
    language?: string;
};

// Helper function for dynamic import with proper typing
const dynamicComponent = <P extends Record<string, any>>(
    importFunc: () => Promise<{ default: React.ComponentType<P> }>,
    options: DynamicOptions<P> = {}
) => {
    return dynamicImport(importFunc as Loader<P>, options);
};

const DynamicMeetProvider = dynamicComponent<MeetProviderProps>(() => import("@/providers/meetProvider"), {
    ssr: false,
    loading: () => (
        <div className="min-h-screen bg-[#121212]">
            <LoadingOverlay text="Preparing your session..." />
        </div>
    ),
});

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
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const meetingId = id as string | undefined;

    // Only run client-side validation
    if (isMounted) {
        const isValidMeetingId = meetingId ? /^[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(meetingId) : true;

        if (pathname !== "/pod" && !pathname.startsWith("/pod/join") && !isValidMeetingId) {
            console.log("Invalid meeting ID and not on join page. Redirecting to /pod");
            router.push("/pod");
            return null;
        }
    }

    return (
        <div className="min-h-screen bg-[#121212]">
            <DynamicMeetProvider meetingId={meetingId} language="en">
                {children}
            </DynamicMeetProvider>
        </div>
    );
}

export default function Layout(props: LayoutProps) {
    return <LayoutContent {...props} />;
}

export const config = {
    dynamic: "force-dynamic",
};
