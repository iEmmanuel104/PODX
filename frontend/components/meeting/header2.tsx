import React from "react"
import { Menu, Copy, User, ArrowUp } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getBasename, getBasenameAvatar } from "@/app/apis/basenames"

async function fetchData(address: `0x${string}`) {
    try {
        const basename = await getBasename(address)
        if (basename) {
            const avatar = await getBasenameAvatar(basename)
            return { basename, avatar }
        } else {
            return { basename: null, avatar: null }
        }
    } catch (error) {
        console.error("Error fetching data:", error)
        return { basename: null, avatar: null }
    }
}

function truncateAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

interface HeaderProps {
    customData: Record<string, any>
    live: boolean
    userAddress: `0x${string}`
    displayBalance: string
    balanceSymbol: string | undefined
    toggleSidebar: () => void
    handleLogout: () => void
    copyAddress: () => void
}

export default async function Header({
    customData,
    live,
    userAddress,
    displayBalance,
    balanceSymbol,
    toggleSidebar,
    handleLogout,
    copyAddress,
}: HeaderProps) {
    const { basename, avatar } = await fetchData(userAddress)
    console.log({ basename, avatar })

    const withdrawFunds = () => {
        console.log("withdrawing funds")
    }

    return (
        <header className="flex justify-between items-center px-2 sm:px-4 py-2 bg-[#1d1d1d] rounded-full w-[98%] sm:w-[95%] mx-auto my-1 sm:my-2">
            <div className="flex items-center justify-between gap-1 sm:gap-2">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0">
                    <Image src="/logo.png" layout="fill" objectFit="contain" alt="Podx" className="p-0.5 sm:p-1" />
                </div>
                <p className="text-xs sm:text-sm md:text-base mr-1 sm:mr-2 w-24 sm:w-full sm:text-center truncate">{customData.title}</p>
                <p className="bg-red-500 text-[10px] sm:text-xs md:text-sm px-1 sm:px-2 py-0.5 rounded-full">{live ? "Live" : "Offline"}</p>
            </div>
            <div className="flex items-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="sr-only">Toggle profile dropdown</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-[#2d2d2d] rounded-xl shadow-lg py-4 sm:py-4 px-4 sm:px-5">
                        <div className="flex items-center mb-4">
                            <div className="flex items-center">
                                {avatar ? (
                                    <Image src={avatar} width={32} height={32} alt="Avatar" className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2" />
                                ) : (
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2 bg-gray-300 flex items-center justify-center">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                                    </div>
                                )}
                                <div className="space-y-1 sm:space-y-2">
                                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                                        <span className="text-white text-xs sm:text-sm font-semibold">
                                            {basename || truncateAddress(userAddress)}
                                        </span>
                                        <p className="text-white text-[10px] sm:text-xs bg-violet-500 rounded-full px-1 sm:px-2 py-0.5">
                                            {displayBalance} {balanceSymbol}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between bg-[#1d1d1d] p-1 sm:p-2 mb-1 sm:mb-2 rounded-full">
                                        <Image src="/images/base.png" alt="Base" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <div className="flex items-center">
                                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                                            <span className="text-[#A3A3A3] text-[10px] sm:text-xs">{truncateAddress(userAddress)}</span>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={copyAddress} className="text-[#A3A3A3] hover:text-white">
                                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DropdownMenuItem asChild>
                            <Button
                                onClick={withdrawFunds}
                                className="flex items-center bg-[#6032F6] rounded-full px-5 py-2 w-full"
                            >
                                <ArrowUp className="h-8 w-8 mr-2" />
                                Withdraw funds
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-[#A3A3A3] hover:text-white transition-colors sm:hidden ml-2"
                    onClick={toggleSidebar}
                >
                    <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="sr-only">Toggle sidebar</span>
                </Button>
            </div>
        </header>
    )
}