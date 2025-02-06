// components/user/userDetails.tsx
'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, LogOut, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Logo from '@/public/images/icons/Logo';
import UserProfile from '../pod/userProfile';
import { UserDetailsProps, UserState } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import WalletOperations from './walletOperations';

const UserDetails = memo<UserDetailsProps>(({ user }) => {
    const router = useRouter();
    const { logout } = useAuth();
    const [state, setState] = useState<UserState>({
        isOpen: false,
        isSettingsOpen: false,
        isWarningOpen: false,
        isWithdrawOpen: false,
        amount: '',
        address: '',
    });

    const handleLogout = useCallback(async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }, [logout]);

    const handleWithdrawClick = useCallback(() => {
        setState(prev => ({
            ...prev,
            isSettingsOpen: false,
            isWarningOpen: true,
        }));
    }, []);

    const handleWarningConfirm = useCallback(() => {
        setState(prev => ({
            ...prev,
            isWarningOpen: false,
            isWithdrawOpen: true,
        }));
    }, []);

    // Determine if it's a Privy wallet
    const isPrivyWallet = user?.walletType === 'privy';

    // Memoize the wallet operations component
    const walletOperationsComponent = React.useMemo(
        () =>
            isPrivyWallet ? (
                <WalletOperations
                    state={state}
                    setState={setState}
                    user={user}
                    onWithdrawClick={handleWithdrawClick}
                    onWarningConfirm={handleWarningConfirm}
                />
            ) : null,
        [isPrivyWallet, state, user, handleWithdrawClick, handleWarningConfirm]
    );

    // Memoize the UserProfile component
    const userProfileComponent = useMemo(() => <UserProfile user={user} />, [user]);

    return (
        <div className="w-full flex flex-col sm:gap-8 gap-4 transition-all duration-200">
            <div className="w-full flex items-center justify-between text-white">
                <div className="flex-shrink-0">{userProfileComponent}</div>

                <div className="flex-shrink-0 hidden sm:block w-[180px] h-[43px]">
                    <Logo />
                </div>

                <div className="flex items-center gap-2">
                    <DropdownMenu
                        open={state.isOpen}
                        onOpenChange={open => setState(prev => ({ ...prev, isOpen: open }))}
                    >
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="text-[#A3A3A3] hover:text-white hover:bg-transparent focus:bg-transparent"
                            >
                                <Settings className="h-5 w-5 sm:mr-2" />
                                <span className="hidden sm:inline">Settings</span>
                            </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent
                            className="w-56 bg-[#1E1E1E] border-[#2E2E2E] text-white rounded-[10px] shadow-lg"
                            align="end"
                            side="bottom"
                            sideOffset={5}
                        >
                            {walletOperationsComponent}

                            <DropdownMenuItem
                                className="flex items-center px-3 py-2 cursor-pointer"
                                onSelect={() => router.push('/pod/activity')}
                            >
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Session history</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="flex items-center px-3 py-2 cursor-pointer text-red-500"
                                onSelect={handleLogout}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
});

UserDetails.displayName = 'UserDetails';
export default UserDetails;
