import { sessionType } from '@/constants';
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

export interface SessionFormState {
    title: string;
    type: sessionType;
    isScheduled: boolean;
    date?: Date;
    time?: string;
}

export interface Session {
    id: string;
    name: string;
    type: string;
    membersCount: number;
    startTime?: string;
    whitelisted: boolean;
}
