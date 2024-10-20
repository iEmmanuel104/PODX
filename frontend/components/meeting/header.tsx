import React from "react";
import { Menu, ChevronDown, LogOutIcon, Copy } from "lucide-react";
import { Avatar, Identity, Name, Address } from "@coinbase/onchainkit/identity";
import { base } from "viem/chains";
import Image from "next/image";
import Logo from "@/components/ui/logo";

interface HeaderProps {
    customData: Record<string, any>;
    live: boolean;
    userAddress: `0x${string}`;
    displayBalance: string;
    balanceSymbol: string | undefined;
    toggleSidebar: () => void;
    toggleProfileDropdown: () => void;
    isProfileDropdownOpen: boolean;
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
    toggleProfileDropdown,
    isProfileDropdownOpen,
    handleLogout,
    copyAddress,
}) => {
    return (
        <header className="flex justify-between items-center px-2 sm:px-4 py-2 bg-[#1d1d1d] rounded-full w-[95%] sm:w-[90%] mx-auto my-2 sm:my-4">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="w-6 h-6 sm:w-8 sm:h-8">
                    <Logo />
                </div>
                <p className="text-xs sm:text-sm mr-1 sm:mr-2 hidden xs:inline max-w-[100px] sm:max-w-full truncate">{customData.title}</p>
                <p className="bg-red-500 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded-full">{live ? "Live" : "Offline"}</p>
            </div>
            <div className="flex items-center">
                <button title="toggle sidebar" className="text-[#A3A3A3] hover:text-white transition-colors sm:hidden mr-2" onClick={toggleSidebar}>
                    <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <div className="relative">
                    <div className="flex items-center">
                        <button
                            title="toggle profile dropdown"
                            className="flex items-center text-[#A3A3A3] hover:text-white transition-colors mr-1 sm:mr-2"
                            onClick={toggleProfileDropdown}
                        >
                            <Identity
                                address={userAddress}
                                chain={base}
                                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                            >
                                <Avatar address={userAddress} chain={base} className="w-6 h-6 sm:w-8 sm:h-8 rounded-full mr-1 sm:mr-2" />
                                <Name
                                    address={userAddress}
                                    chain={base}
                                    className="hidden xs:inline text-xs sm:text-sm mr-1 sm:mr-2 max-w-[60px] sm:max-w-full truncate"
                                />
                            </Identity>
                            <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <div className="flex justify-between items-center">
                            <LogOutIcon className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                            <button
                                onClick={handleLogout}
                                className="text-red-500 text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded hover:bg-[#3d3d3d] transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                    {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-[#2d2d2d] rounded-xl shadow-lg py-2 sm:py-3 px-3 sm:px-4 z-10">
                            <div className="flex items-center">
                                <Identity
                                    address={userAddress}
                                    chain={base}
                                    schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                                >
                                    <Avatar address={userAddress} chain={base} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 sm:mr-3" />
                                    <div className="space-y-1 sm:space-y-2">
                                        <div className="flex items-center justify-between gap-1 sm:gap-2">
                                            <Name address={userAddress} chain={base} className="text-white text-xs sm:text-sm font-semibold" />
                                            <p className="text-white text-[10px] sm:text-xs bg-violet-500 rounded-full px-1 sm:px-2 py-0.5">
                                                {displayBalance} {balanceSymbol}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between bg-[#1d1d1d] p-1 sm:p-2 mb-1 sm:mb-2 rounded-full">
                                            <Image src="/images/base.png" alt="Base" width={20} height={20} className="w-4 h-4 sm:w-6 sm:h-6" />
                                            <div className="flex items-center">
                                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full mr-1 sm:mr-2"></div>
                                                <Address
                                                    address={userAddress}
                                                    className="text-[#A3A3A3] text-[8px] sm:text-xs max-w-[80px] sm:max-w-[120px] truncate"
                                                />
                                            </div>
                                            <button title="copy" onClick={copyAddress} className="text-[#A3A3A3] hover:text-white">
                                                <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </Identity>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
