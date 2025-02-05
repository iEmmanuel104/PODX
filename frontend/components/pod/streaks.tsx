"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Info } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Fire from "@/public/icons/Fire"
import Farcaster from "@/public/icons/socials/Farcaster"
import X from "@/public/icons/socials/X"

interface StreakDialogProps {
    streak?: number
}

export function StreakDialog({ streak = 3 }: StreakDialogProps) {
    const [isOpen, setIsOpen] = useState(false)

    const handleShare = (platform: "x" | "warpcast") => {
        const text = `I have a ${streak} day streak on PodX! 🔥`
        const url = "https://podx.com" // Replace with actual URL

        if (platform === "x") {
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`)
        } else if (platform === "warpcast") {
            window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger className="max-w-[275px] mx-auto" asChild>
                <div className="flex justify-center items-center">
                    <div className="rounded-full bg-gradient-to-r from-[#552FC9]  to-[#D7B35D] p-[1px]">
                        <Button
                            variant="ghost"
                            className="flex justify-between items-center rounded-full bg-[#151515] text-white text-xs tracking-wider py-[4px] px-[16px]"
                        >
                            <div className="h-[14px] w-[14px]">
                                <Fire />
                            </div>
                            <span>You have no session streak</span>
                            <div className="icon-container h-[14px] w-[14px]">
                                <Info />
                            </div>
                        </Button>
                    </div>
                </div>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[425px] bg-[#1E1E1E] text-white border border-[#2E2E2E] p-0 rounded-[10px]">
                <div className="p-6 flex flex-col items-center gap-4">
                    <div className="h-[52px] w-[52px]">
                        <Fire />
                    </div>

                    <DialogTitle className="text-6xl text-center font-bold">
                        {streak} {streak === 1 ? "day" : "days"}
                    </DialogTitle>
                    <DialogDescription className="text-white text-lg">Session Streak</DialogDescription>

                    <div className="flex flex-col items-center gap-2 mt-4">
                        <DialogDescription className="text-center text-[#A3A3A3] mb-6">
                            <p className="max-w-[238px]">
                                Session streaks are consecutive daily sessions that are either created or attended.
                            </p>
                        </DialogDescription>
                    </div>

                    <div className="flex gap-2 w-full">
                        <Button
                            className="flex-1 bg-[#DDB958] hover:bg-[#DDB958]/90 text-black rounded-[10px] py-3 px-4 w-1/2"
                            onClick={() => setIsOpen(false)}
                        >
                            Create session
                        </Button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="bg-[#2E2E2E] border-[#2E2E2E] hover:bg-[#2E2E2E]/90 hover:border-[#2E2E2E] py-3 px-4 text-white hover:text-white rounded-[10px] w-1/2"
                                >
                                    Share
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1E1E1E] border-[#2E2E2E]">
                                <DropdownMenuItem
                                    className="text-white hover:bg-[#2E2E2E] cursor-pointer"
                                    onClick={() => handleShare("x")}
                                >
                                    <X />
                                    Share to X
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="text-white hover:bg-[#2E2E2E] cursor-pointer"
                                    onClick={() => handleShare("warpcast")}
                                >
                                    <Farcaster />
                                    Share to Warpcast
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

