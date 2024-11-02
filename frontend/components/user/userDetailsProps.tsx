"use client";
// Types
export interface User {
    username?: string;
    walletAddress: string;
    walletClientType?: string;
}
export interface UserDetailsProps {
    user: User;
    walletType: string;
}
export interface UserState {
    isOpen: boolean;
    isSettingsOpen: boolean;
    isWarningOpen: boolean;
    isWithdrawOpen: boolean;
    amount: string;
    address: string;
}
