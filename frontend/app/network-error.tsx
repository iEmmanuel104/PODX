"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useTypedSelector } from "@/store/config/store"
import { useMemo } from "react"
import Logo from "@/components/ui/logo"

export default function NetworkError() {
    const router = useRouter()
    const { isLoggedIn, user } = useTypedSelector(state => state.auth);
    const userInfo = useMemo(
        () => ({
            displayName: user?.username || `${user?.walletAddress.slice(0, 6)}...${user?.walletAddress.slice(-4)}`,
            initials: user?.username
                ? user.username.slice(0, 2).toUpperCase()
                : user?.walletAddress.slice(0, 2).toUpperCase(),
        }),
        [user],
    )

    return (
        <div className="min-h-screen bg-[#151515] flex flex-col items-center justify-between p-8 relative">
            {/* Grid Background Pattern */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                    backgroundSize: "50px 50px",
                    opacity: 0.1,
                }}
            />

            {/* Logo */}
            <div className="w-full flex justify-center pt-8">
                <Logo />
            </div>

            {/* Error Content */}
            <div className="text-center max-w-md">
                <h1 className="text-white text-2xl font-semibold mb-4">Network Error</h1>
                <p className="text-white/60 mb-8">
                    Unfortunately, there seems to be a problem with the network at the moment, please try again later
                </p>
                <div className="flex gap-4 justify-center">
                    <Button className="bg-[#DDB958] hover:bg-[#DDB958]/90 text-black px-8" onClick={() => router.refresh()}>
                        Rejoin
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-[#383838] hover:bg-[#383838]/90 text-white px-8"
                        onClick={() => router.push("/")}
                    >
                        Return home
                    </Button>
                </div>
            </div>

            {/* Profile Section */}
            {isLoggedIn && (
                <div className="w-full max-w-md space-y-12 mb-12">
                    <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-2 w-fit mx-auto">
                        <div className="w-6 h-6 rounded-full bg-[#6032f6] flex items-center justify-center text-white text-sm">
                            {userInfo.initials}
                        </div>
                        <div className="w-2 h-2 bg-green-500 rounded-full border border-[#151515]"></div>
                        <span className="text-white/60 text-sm">{userInfo.displayName}</span>
                    </div>

                    <Button
                        variant="ghost"
                        className="flex items-center gap-2 text-[#F63232] hover:text-[#F63232]/90 hover:bg-transparent mx-auto"
                        onClick={() => {
                            /* Add logout logic here */
                        }}
                    >
                        <LogOut size={16} />
                        <span>Logout</span>
                    </Button>
                </div>
            )}
        </div>
    )
}
