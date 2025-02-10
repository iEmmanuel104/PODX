import { UserInfo } from '@/store/user/types';
import React from 'react';


export interface UserState {
    isOpen: boolean;
    isSettingsOpen: boolean;
    isWarningOpen: boolean;
    isWithdrawOpen: boolean;
    amount: string;
    address: string;
}

export interface UserDetailsProps {
    user: UserInfo;
}export interface WalletOperationsProps {
    state: UserState;
    setState: React.Dispatch<React.SetStateAction<UserState>>;
    user: UserInfo;
    onWithdrawClick: () => void;
    onWarningConfirm: () => void;
    isBalanceHidden?: boolean;
}

