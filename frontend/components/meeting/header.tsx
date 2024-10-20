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
        <header className="flex justify-between items-center px-4 py-2 bg-[#1d1d1d] rounded-full w-[90%] mx-auto my-4">
            <div className="flex items-center justify-between gap-4">
                <Logo />
                <p className="text-sm mr-2 hidden sm:inline w-full">{customData.title}</p>
                <p className="bg-red-500 text-xs px-2 py-0.5 rounded-full">{live ? "Live" : "Offline"}</p>
            </div>
            <div className="flex items-center">
                <button
                    title="toggle sidebar"
                    className="text-[#A3A3A3] hover:text-white transition-colors sm:hidden mr-2 sm:mr-4"
                    onClick={toggleSidebar}
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="relative">
                    <div className="flex items-center">
                        <button
                            title="toggle profile dropdown"
                            className="flex items-center text-[#A3A3A3] hover:text-white transition-colors mr-2 sm:mr-4"
                            onClick={toggleProfileDropdown}
                        >
                            <Identity
                                address={userAddress}
                                chain={base}
                                schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                            >
                                <Avatar address={userAddress} chain={base} className="w-8 h-8 rounded-full mr-2" />
                                <Name address={userAddress} chain={base} className="mr-2" />
                            </Identity>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        <div className="flex justify-between items-center">
                            <LogOutIcon className="w-4 h-4 text-red-500" />
                            <button onClick={handleLogout} className="text-red-500 px-3 py-1 rounded hover:bg-[#3d3d3d] transition-colors">
                                Logout
                            </button>
                        </div>
                    </div>
                    {isProfileDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-[#2d2d2d] rounded-xl shadow-lg py-3 px-4 z-10">
                            <div className="flex items-center">
                                <Identity
                                    address={userAddress}
                                    chain={base}
                                    schemaId="0xf8b05c79f090979bf4a80270aba232dff11a10d9ca55c4f88de95317970f0de9"
                                >
                                    <Avatar address={userAddress} chain={base} className="w-10 h-10 rounded-full mr-3" />
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <Name address={userAddress} chain={base} className="text-white font-semibold" />
                                            <p className="text-white text-sm bg-violet-500 rounded-full px-2 py-0.5">
                                                {displayBalance} {balanceSymbol}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between bg-[#1d1d1d] p-2 mb-2 rounded-full">
                                            <Image src="/images/base.png" alt="Base" width={24} height={24} className="w-6 h-6" />{" "}
                                            <div className="flex items-center">
                                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                                <Address address={userAddress} className="text-[#A3A3A3] text-xs" />
                                            </div>
                                            <button title="copy" onClick={copyAddress} className="text-[#A3A3A3] hover:text-white">
                                                <Copy className="w-4 h-4" />
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
