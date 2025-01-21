'use client';

import Image from 'next/image';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';
import Logo from '@/components/ui/logo';

export default function NotFound() {
    const { isLoggedIn, user } = useAppSelector(state => state.user);
    const userInfo = useMemo(
        () => ({
            displayName:
                user?.username ||
                `${user?.walletAddress.slice(0, 6)}...${user?.walletAddress.slice(-4)}`,
            initials: user?.username
                ? user.username.slice(0, 2).toUpperCase()
                : user?.walletAddress.slice(0, 2).toUpperCase(),
        }),
        [user]
    );
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-12">
                    <Logo />
                </div>
                <div className="flex flex-col items-center mb-12">
                    <div className="flex justify-center items-center mb-6">
                        <Image src="/images/error.png" alt="Network Error" width={96} height={96} />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Network Error</h1>
                    <p className="text-zinc-400 text-sm mb-8 text-center">
                        Unfortunately, there seems to be a problem with the network at the moment,
                        please try again later
                    </p>
                    {/* User profile */}
                    <div className="flex items-center justify-center space-x-3 bg-[#333333] rounded-full px-2 py-1 w-fit">
                        <div className="bg-[#6032F6] rounded-full flex items-center justify-center text-sm font-bold">
                            {userInfo.initials}
                        </div>
                        <span className="text-sm sm:text-base">{userInfo.displayName}</span>
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
    );
}
