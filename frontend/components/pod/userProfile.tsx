'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import { Edit3, Check, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';

interface UserProfileProps {
    user: {
        username?: string;
        walletAddress: string;
        walletClientType?: string;
    };
}

const formatAddress = (addr: string): string =>
    addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const UserProfile = memo<UserProfileProps>(({ user }) => {
    const dispatch = useAppDispatch();
    const [isEditing, setIsEditing] = useState(false);
    const [editedUsername, setEditedUsername] = useState(user?.username || '');

    const userInfo = useMemo(
        () => ({
            displayName: user?.username || formatAddress(user?.walletAddress),
            initials: (user?.username || user?.walletAddress).slice(0, 2).toUpperCase(),
        }),
        [user]
    );

    const handleEditClick = useCallback(() => {
        setIsEditing(true);
        setEditedUsername(user?.username || '');
    }, [user?.username]);

    const handleSaveUsername = useCallback(() => {
        if (editedUsername.trim() && editedUsername !== user?.username) {
            dispatch(updateUser({ username: editedUsername.trim() }));
        }
        setIsEditing(false);
    }, [editedUsername, user?.username, dispatch]);

    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setEditedUsername(user?.username || '');
    }, [user?.username]);

    if (isEditing) {
        return (
            <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5">
                <Avatar className="h-6 w-6">
                    <AvatarImage src={userInfo.initials} alt={userInfo.initials} />
                    <AvatarFallback>{userInfo.initials}</AvatarFallback>
                </Avatar>
                <div className="h-1 w-1 rounded-full bg-green-500" />
                <Input
                    value={editedUsername}
                    onChange={e => setEditedUsername(e.target.value)}
                    className="h-8 w-40 bg-zinc-800 border-none text-white"
                    autoFocus
                />
                <Button
                    onClick={handleSaveUsername}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-zinc-800"
                >
                    <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                    onClick={handleCancelEdit}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-zinc-800"
                >
                    <X className="h-4 w-4 text-red-500" />
                </Button>
            </div>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800">
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={userInfo.initials} alt={userInfo.initials} />
                        <AvatarFallback>{userInfo.initials}</AvatarFallback>
                    </Avatar>
                    <div className="h-1 w-1 rounded-full bg-green-500" />
                    <span className="text-sm text-zinc-100">{editedUsername}</span>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="min-w-[144px] bg-zinc-900 p-2 border-none"
            >
                <DropdownMenuItem
                    className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-zinc-100"
                    onSelect={e => {
                        e.preventDefault();
                        handleEditClick();
                    }}
                >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit name</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2">
                    <span className="bg-gradient-to-br from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent">
                        Buy basename
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
});

UserProfile.displayName = 'UserProfile';
export default UserProfile;