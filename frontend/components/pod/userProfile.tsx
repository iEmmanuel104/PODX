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
import { getBasename, getBasenameAvatar } from '@/app/apis/basenames';
import Link from 'next/link';
import { useAppDispatch } from '@/store/config/store';
import { useUpdateUsernameMutation } from '@/store/user/slice';
import { updateUser } from '@/store/auth/slice';
import { UserDetailsProps } from '@/types'

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



function UserProfileAvatar({loading, userInfo}: {loading: boolean, userInfo: any}) {
    return (
        <DropdownMenuTrigger asChild>
            <button
                className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800"
                disabled={loading}
            >
                <Avatar className="h-6 w-6">
                    {userInfo.avatar ? (
                        <AvatarImage src={userInfo.avatar} alt={userInfo.displayName} />
                    ) : (
                        <AvatarFallback>{userInfo.initials}</AvatarFallback>
                    )}
                </Avatar>
                <div className="h-1 w-1 rounded-full bg-green-500" />
                <span className="text-sm text-zinc-100">
                    {loading ? 'Updating...' : userInfo.displayName}
                </span>
            </button>
        </DropdownMenuTrigger>
    );
}

function UpdateUserComponent({username, onChange, loading, notification}:{username:string, onChange: any, loading: boolean, notification: NotificationProps | null}) {

    return (
        <div className="space-y-6">
            <p className="text-[#7b7b7b] text-[14px]">Pick a unique username</p>
            <div className="space-y-2">
                <div className="relative">
                    <Input
                        value={username}
                        onChange={onChange}
                        className="bg-[#292929] border-0 text-white px-4 py-2.5 rounded-[10px]"
                        // placeholder={Boolean(username) ? username : "Enter username"}
                        placeholder={"Enter username"}
                        disabled={loading}
                    />
                </div>
                <div className="text-right">
                    <button
                        className="text-[#d5b255] hover:text-[#d5b255]/80 text-sm underline"
                        disabled={loading}
                    >
                        Ask AI to suggest
                    </button>
                </div>
            </div>
            {notification && <Notification {...notification} />}
        </div>
    );
}

const UserProfile = memo<UserDetailsProps>(({ user }) => {

    // console.log("User seen:", user.username);
    const dispatch = useAppDispatch();
    const [updateUsername] = useUpdateUsernameMutation();

    const [state, setState] = useState({
        isDialogOpen: false,
        isLoading: false,
        // username: user.username || '',
        notification: null as NotificationProps | null,
        basename: null as string | null,
        avatar: null as string | null,
    });

    const [username, setUsername] = useState<string>(user.username);

    // Reset dialog state completely on close
    const handleDialogClose = useCallback(() => {
        setState(prev => ({
            ...prev,
            isDialogOpen: false,
            notification: null,
            username: user?.username || '',
        }));
    }, [user?.username]);

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

    const handleUsernameChange = async () => {
        const updated_username = username.trim();
        const isSame = Object.is(user.username, updated_username);
        const isEmpty = !Boolean(updated_username);

        if (isSame || isEmpty) {
            
            handleDialogClose();
            return;
        }


        try {
            if (!user.id) throw new Error('User ID is required');

            setState(prev => ({ ...prev, isLoading: true }));

            const result = await updateUsername({
                userId: user.id,
                username: updated_username,
            }).unwrap();

            if (result.status === 'success') {
                dispatch(updateUser({ username: updated_username }));
                setState(prev => ({
                    ...prev,
                    notification: { type: 'success', message: 'Username updated successfully' },
                }));
                // Use setTimeout to ensure state updates are batched
                setTimeout(() => {
                    handleDialogClose();
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
    };

    const userInfo = useMemo(
        () => ({
            avatar: state.avatar,
            displayName: state.basename || user?.username || formatAddress(user?.walletAddress),
            initials: (state.basename || user?.username || user?.walletAddress || '')
                .slice(0, 2)
                .toUpperCase(),
        }),
        [state.basename, state.avatar, user?.username, user?.walletAddress]
    );

    useEffect(() => {
        if (user?.walletAddress) {
            fetchBasenameData(user.walletAddress as `0x${string}`);
        }
    }, [user?.walletAddress, fetchBasenameData]);

    return (
        <>
            <DropdownMenu>
                <UserProfileAvatar loading={state.isLoading} userInfo={userInfo} />

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
                onOpenChange={open => {
                    if (!open) {
                        handleDialogClose();
                    } else {
                        setState(prev => ({ ...prev, isDialogOpen: true }));
                    }
                }}
            >
                <DialogContent className="sm:max-w-md bg-[#1d1d1d] border-0 rounded-lg">
                    <DialogHeader>
                        <DialogTitle className="text-[20px] text-white">
                            Set your username
                        </DialogTitle>
                    </DialogHeader>

                    <UpdateUserComponent
                        username={username}
                        onChange={(e: any) => setUsername(e.target.value)}
                        loading={state.isLoading}
                        notification={state.notification}
                    />

                    <DialogFooter className="gap-2 sm:gap-2 mt-2">
                        <Button
                            variant="secondary"
                            onClick={handleDialogClose}
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
                                !username.trim() ||
                                username === user?.username
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
