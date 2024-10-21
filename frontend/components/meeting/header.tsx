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

const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const Header: React.FC<HeaderProps> = ({
    customData,
    live,
    userAddress,
    displayBalance,
    balanceSymbol,
    toggleSidebar,
    handleLogout,
    copyAddress,
}) => {
    console.log(userAddress, displayBalance, balanceSymbol)

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
                        <Button variant="ghost" size="icon" className="text-[#A3A3A3] hover:text-white transition-colors">
                            <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[300px] bg-[#2d2d2d] rounded-xl shadow-lg py-4 sm:py-4 px-4 sm:px-5 border-none">
                        <div className="flex items-center justify-between mb-4 gap-3">
                            <div className="w-full h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center">
                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                            </div>
                            <div className="space-y-1 sm:space-y-2 w-full">
                                <div className="flex items-center justify-between gap-1 sm:gap-2">
                                    <span className="text-white text-xs sm:text-sm font-semibold">{truncateAddress(userAddress)}</span>
                                    <p className="text-white text-[10px] sm:text-xs bg-violet-500 rounded-full px-1 sm:px-2 py-0.5">
                                        {displayBalance} {balanceSymbol}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between bg-[#1d1d1d] pl-3 mb-0.5 sm:mb-1 rounded-full">
                                    <Image src="/images/base.png" alt="Base" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <div className="flex items-center">
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                                        <span className="text-[#A3A3A3] text-[10px] sm:text-xs">{truncateAddress(userAddress)}</span>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={copyAddress} className="text-[#A3A3A3] hover:text-white hover:bg-black">
                                        <Copy className="w-2 h-2 sm:w-2 sm:h-2" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DropdownMenuItem asChild>
                            <Button
                                onClick={withdrawFunds}
                                className="flex items-center bg-[#6032F6] hover:bg-[#4006fc] hover:cursor-pointer rounded-full px-5 py-2 w-full"
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
                </Button>
            </div>
        </header>
    )
}

export default Header