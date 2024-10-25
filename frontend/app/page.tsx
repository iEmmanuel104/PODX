'use client'

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { useAppDispatch } from "@/store/hooks"
import { logOut } from "@/store/slices/userSlice"
import toast from "react-hot-toast"
import Logo from "@/components/ui/logo"

export default function LandingPage() {
    const dispatch = useAppDispatch()
    const [isConnecting, setIsConnecting] = useState(false)
    const { login, logout } = usePrivy()

    const handleConnect = async () => {
        setIsConnecting(true)
        try {
            await logout() // Log out of existing privy session
            dispatch(logOut()) // clear user data from store
            await login()
        } catch (error) {
            console.error("Error connecting wallet:", error)
            toast.error("Error connecting wallet")
        } finally {
            setIsConnecting(false)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl flex flex-col items-center">
                <Logo />

                <div className="relative inline-block mt-20 mb-2">
                    <p className="text-[#A3A3A3] text-xs uppercase tracking-wider px-4 py-1 relative z-10">
                        A creator's workspace
                    </p>
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#6032F6] via-[#FF6B00] to-[#6032F6]" style={{ padding: '1px' }}></div>
                    <div className="absolute inset-[1px] rounded-full bg-black"></div>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl text-center font-serif mb-8 leading-tight">
                    Host meetings, record sessions,
                    <br />
                    earn proof of attendance, and
                    <br />
                    <span className="inline-block">
                        <span className="bg-gradient-to-r from-[#6032F6] to-[#FF6B00] text-transparent bg-clip-text">tip</span>
                    </span> seamlessly
                </h1>

                <button
                    className="mt-8 py-2 px-8 rounded-xl bg-[#6032F6] hover:bg-[#4C28C4] transition-colors text-white font-medium text-lg"
                    onClick={handleConnect}
                    disabled={isConnecting}
                >
                    {isConnecting ? "Connecting..." : "Get started"}
                </button>
            </div>
        </div>
    )
}