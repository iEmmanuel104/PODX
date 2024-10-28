import Image from "next/image"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function ErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-12">
                    <Image
                        src="/placeholder.svg?height=40&width=40"
                        alt="Logo"
                        width={40}
                        height={40}
                        className="text-purple-500"
                    />
                </div>
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-6">
                        <Image
                            src="/placeholder.svg?height=96&width=96"
                            alt="Network Error"
                            width={96}
                            height={96}
                        />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Network Error</h1>
                    <p className="text-zinc-400 text-sm mb-8">
                        Unfortunately, there seems to be a problem with the network at the moment, please try again later
                    </p>
                    <div className="flex items-center justify-center space-x-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" alt="User" />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-zinc-400">folajinisayo.base.eth</span>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Button
                        variant="ghost"
                        className="text-red-500 hover:text-red-400 hover:bg-transparent"
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Logout
                    </Button>
                </div>
            </div>
        </div>
    )
}