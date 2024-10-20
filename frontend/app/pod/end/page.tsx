import { Button } from "@/components/ui/button"
import Logo from "@/components/ui/logo"
import { LogOut, Video } from "lucide-react"


export default function EndScreen() {
    return (
        <div className="flex flex-col items-center justify-between min-h-screen bg-black text-white p-8">
            <div className="w-full max-w-md flex flex-col items-center flex-grow gap-32 mt-20">
                <Logo />
                <div>
                    <h1 className="text-2xl font-semibold mb-8">The session has ended</h1>
                    <Button className="bg-[#6032f6] hover:bg-[#4C28C4] text-white font-medium py-2 px-4 rounded-full w-full max-w-xs">
                        Return to home screen
                    </Button>
                </div>
            </div>
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="flex items-center mb-4">
                    <div className="w-6 h-6 rounded-full bg-[#6032f6] flex items-center justify-center text-xs font-bold mr-2">
                        F
                    </div>
                    <span className="text-gray-400">folajindayo.base.eth</span>
                </div>
                <button className="text-red-500 flex items-center">
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                </button>
            </div>
        </div>
    )
}