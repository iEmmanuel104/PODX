// UserProfile.tsx
import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Edit3, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';
import { getBasename, getBasenameAvatar } from '@/app/apis/basenames';
import Link from 'next/link';
import { useUpdateUsernameMutation } from '@/store/api/userApi';

interface UserProfileProps {
    user: {
        id?: string;
        username?: string;
        walletAddress: string;
        walletClientType?: string;
    };
}

interface NotificationProps {
    message: string;
    type: 'error' | 'success';
}

const Notification = memo(({ message, type }: NotificationProps) => (
    <div
        className={`flex items-center gap-2 text-sm ${type === 'error' ? 'text-red-500' : 'text-green-500'}`}
    >
        {type === 'error' ? (
            <AlertCircle className="h-4 w-4" />
        ) : (
            <CheckCircle2 className="h-4 w-4" />
        )}
        <span>{message}</span>
    </div>
));

Notification.displayName = 'Notification';

const formatAddress = (addr: string): string =>
    addr ? (addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`) : '';

const UserProfile = memo<UserProfileProps>(({ user }) => {
    const dispatch = useAppDispatch();
    const [updateUsername] = useUpdateUsernameMutation();

    const [state, setState] = useState({
        isDialogOpen: false,
        isLoading: false,
        username: user?.username || '',
        notification: null as NotificationProps | null,
        basename: null as string | null,
        avatar: null as string | null,
    });

    const fetchBasenameData = useCallback(async (address: `0x${string}`) => {
        try {
            const basename = await getBasename(address);
            if (basename) {
                const avatar = await getBasenameAvatar(basename);
                setState(prev => ({ ...prev, basename, avatar }));
            }
        } catch (error) {
            console.error('Error fetching basename:', error);
        }
    }, []);

    const handleUsernameChange = useCallback(async () => {
        if (!state.username.trim() || state.username === user?.username) {
            setState(prev => ({ ...prev, isDialogOpen: false }));
            return;
        }

        try {
            if (!user.id) throw new Error('User ID is required');

            setState(prev => ({ ...prev, isLoading: true }));
            const result = await updateUsername({
                userId: user.id,
                username: state.username.trim(),
            }).unwrap();

            if (result.status === 'success') {
                dispatch(updateUser({ username: state.username.trim() }));
                setState(prev => ({
                    ...prev,
                    notification: { type: 'success', message: 'Username updated successfully' },
                }));
                setTimeout(() => {
                    setState(prev => ({ ...prev, isDialogOpen: false, notification: null }));
                }, 1500);
            } else {
                throw new Error(result.message || 'Failed to update username');
            }
        } catch (error) {
            setState(prev => ({
                ...prev,
                notification: {
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Failed to update username',
                },
            }));
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    }, [state.username, user?.id, user?.username, dispatch, updateUsername]);

    const userInfo = useMemo(
        () => ({
            displayName: state.basename || user?.username || formatAddress(user?.walletAddress),
            initials: (state.basename || user?.username || user?.walletAddress || '')
                .slice(0, 2)
                .toUpperCase(),
        }),
        [state.basename, user?.username, user?.walletAddress]
    );

    useEffect(() => {
        if (user?.walletAddress) {
            fetchBasenameData(user.walletAddress as `0x${string}`);
        }
    }, [user?.walletAddress, fetchBasenameData]);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800"
                        disabled={state.isLoading}
                    >
                        <Avatar className="h-6 w-6">
                            {state.avatar ? (
                                <AvatarImage src={state.avatar} alt={userInfo.displayName} />
                            ) : (
                                <AvatarFallback>{userInfo.initials}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="h-1 w-1 rounded-full bg-green-500" />
                        <span className="text-sm text-zinc-100">
                            {state.isLoading ? 'Updating...' : userInfo.displayName}
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="min-w-[144px] bg-zinc-900 p-2 border-none"
                >
                    {!state.basename && (
                        <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-zinc-100"
                            onClick={() => setState(prev => ({ ...prev, isDialogOpen: true }))}
                            disabled={state.isLoading}
                        >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit name</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link
                            href="https://www.base.org/names"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2"
                        >
                            <span className="bg-gradient-to-br from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent">
                                {state.basename ? 'Manage basename' : 'Buy basename'}
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
                open={state.isDialogOpen}
                onOpenChange={open => setState(prev => ({ ...prev, isDialogOpen: open }))}
            >
                <DialogContent className="sm:max-w-md bg-[#1d1d1d] border-0 rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[20px] text-white">
                            Set your username
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <p className="text-[#7b7b7b] text-[14px]">Pick a unique username</p>
                        <div className="space-y-2">
                            <div className="relative">
                                <Input
                                    value={state.username}
                                    onChange={e =>
                                        setState(prev => ({ ...prev, username: e.target.value }))
                                    }
                                    className="bg-[#292929] border-0 text-white px-4 py-2.5 rounded-[10px]"
                                    placeholder="Enter username"
                                    disabled={state.isLoading}
                                />
                            </div>
                            <div className="text-right">
                                <button
                                    className="text-[#d5b255] hover:text-[#d5b255]/80 text-sm underline"
                                    disabled={state.isLoading}
                                >
                                    Ask AI to suggest
                                </button>
                            </div>
                        </div>
                        {state.notification && <Notification {...state.notification} />}
                    </div>
                    <DialogFooter className="gap-2 sm:gap-2 mt-2">
                        <Button
                            variant="secondary"
                            onClick={() => setState(prev => ({ ...prev, isDialogOpen: false }))}
                            className="bg-[#3c3c3c] hover:bg-[#3c3c3c]/90 text-white border-0"
                            disabled={state.isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUsernameChange}
                            className="bg-[#6032f6] hover:bg-[#6032f6]/90 text-white"
                            disabled={
                                state.isLoading ||
                                !state.username.trim() ||
                                state.username === user?.username
                            }
                        >
                            {state.isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
});

UserProfile.displayName = 'UserProfile';
export default UserProfile;
