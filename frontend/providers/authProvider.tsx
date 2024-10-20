"use client";
import { useCallback, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import { useRouter, usePathname } from "next/navigation";
import { LoadingOverlay } from "@/components/ui/loading";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const storeUser = useAppSelector((state) => state.user);
    const router = useRouter();
    const pathname = usePathname();

    const handleAuth = useCallback(() => {
        console.log("AuthProvider handleAuth");
        console.log({ storeUser, pathname });
        if (!storeUser.isLoggedIn) {
            if (pathname.startsWith("/pod") && !pathname.startsWith("/pod/join")) {
                console.log("User not logged in, attempting to access protected pod page. Redirecting to home page");
                router.push("/");
            }
        } else {
            if (pathname === "/") {
                console.log("Logged in user on home page, redirecting to pod page");
                const pendingSessionCode = localStorage.getItem("pendingSessionCode");
                if (pendingSessionCode) {
                    localStorage.removeItem("pendingSessionCode");
                    router.push(`/pod/join/${pendingSessionCode}`);
                } else {
                    router.push("/pod");
                }
            }
        }
    }, [storeUser.isLoggedIn, router, pathname]);

    useEffect(() => {
        handleAuth();
    }, [handleAuth]);

    return <>{children}</>;
}
