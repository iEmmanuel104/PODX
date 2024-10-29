'use client'

import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import { useAppSelector } from "@/store/hooks"
import { LogOut, Video } from "lucide-react"
import { useRouter } from "next/navigation"


export default function EndScreen() {
    const router = useRouter()
    const user = useAppSelector((state) => state.user.user)

    return (
        <div className="flex flex-col items-center justify-between h-full text-white p-8">
            <div className="w-full max-w-md flex flex-col items-center flex-grow gap-32 mt-20">
                <Logo />
                <div>
                    <h1 className="text-2xl font-semibold mb-8">The session has ended</h1>
                    <Button
                        onClick={() => router.push("/pod")}
                        className="bg-[#6032f6] hover:bg-[#4C28C4] text-white font-medium py-2 px-4 rounded-full w-full max-w-xs">
                        Return to home screen
                    </Button>
                </div>
            </div>
            <div className="w-full max-w-md flex flex-col items-center gap-8 mt-8">
                <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#6032f6] flex items-center justify-center text-xs font-bold mr-2">
                        {user?.username.slice(0,1)}
                    </div>
                    <span className="text-gray-400">{user?.username}</span>
                </div>
                <button
                    onClick={() => { }}
                    className="text-red-500 flex items-center"
                >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                </button>
            </div>
        </div>
    )
}