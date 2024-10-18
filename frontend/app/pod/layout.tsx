"use client";
import { ReactNode, useEffect } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import MeetProvider from "@/providers/meetProvider";
import { Suspense } from "react";
import { LoadingOverlay } from "@/components/ui/loading";

type LayoutProps = {
    children: ReactNode;
    params: {
        id: string;
    };
};

function LayoutContent({ children, params }: LayoutProps) {
    const { id } = useParams();
    const router = useRouter();
    const pathname = usePathname();

    const meetingId = (id as string) || params.id;

    console.log({ LayoutFile: meetingId, pathname });

    useEffect(() => {
        const shouldRedirect = pathname === "/pod" || pathname === "/pod/join" || (pathname.startsWith("/pod") && !meetingId);

        if (shouldRedirect) {
            console.log("Redirecting to landing page");
            router.push("/landing");
        }
    }, [meetingId, router, pathname]);

    if (!meetingId) {
        return null;
    }

    return <MeetProvider meetingId={meetingId}>{children}</MeetProvider>;
}

export default function Layout(props: LayoutProps) {
    return (
        <Suspense fallback={<LoadingOverlay text="Preparing your session..." />}>
            <LayoutContent {...props} />
        </Suspense>
    );
}

export const dynamic = "force-dynamic";
