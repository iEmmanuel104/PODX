import React, { useState } from "react";
import { Menu, ChevronDown, LogOutIcon, Copy, User } from "lucide-react";
import { Avatar, Identity, Name, Address } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";
import Image from "next/image";

interface HeaderProps {
    customData: Record<string, any>;
    live: boolean;
    userAddress: `0x${string}`;
    displayBalance: string;
    balanceSymbol: string | undefined;
    toggleSidebar: () => void;
    handleLogout: () => void;
    copyAddress: () => void;
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
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

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
                <div className="relative">
                    <button
                        title="toggle profile dropdown"
                        className="flex items-center text-[#A3A3A3] hover:text-white transition-colors"
                        onClick={toggleProfileDropdown}
                    >
                        <User className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                        <button
                            title="toggle sidebar"
                            className="text-[#A3A3A3] hover:text-white transition-colors sm:hidden mr-1"
                            onClick={toggleSidebar}
                        >
                            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>{" "}
                    </button>
                    {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-[#2d2d2d] rounded-xl shadow-lg py-2 sm:py-3 px-3 sm:px-4 z-10">
                            <div className="flex items-center">
                                <Identity
                                    address={userAddress}
                                    chain={base}
                                    schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                                >
                                    <Avatar address={userAddress} chain={base} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-2" />
                                    <div className="space-y-1 sm:space-y-2">
                                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                                            <Name address={userAddress} chain={base} className="text-white text-xs sm:text-sm font-semibold" />
                                            <p className="text-white text-[10px] sm:text-xs bg-violet-500 rounded-full px-1 sm:px-2 py-0.5">
                                                {displayBalance} {balanceSymbol}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between bg-[#1d1d1d] p-1 sm:p-2 mb-1 sm:mb-2 rounded-full">
                                            <Image src="/images/base.png" alt="Base" width={16} height={16} className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <div className="flex items-center">
                                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                                                <Address address={userAddress} className="text-[#A3A3A3] text-[10px] sm:text-xs" />
                                            </div>
                                            <button title="copy" onClick={copyAddress} className="text-[#A3A3A3] hover:text-white">
                                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Identity>
                            </div>
                            <div className="flex justify-center items-center mt-2">
                                <LogOutIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 mr-1" />
                                <button
                                    onClick={handleLogout}
                                    className="text-red-500 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded hover:bg-[#3d3d3d] transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
