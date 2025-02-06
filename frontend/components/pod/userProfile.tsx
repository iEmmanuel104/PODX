import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Edit3, ArrowUpRight } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/userSlice';
import { UsernameModal } from './username-modal';
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

const formatAddress = (addr: string): string =>
    addr ? (addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`) : '';

const UserProfile = memo<UserProfileProps>(({ user }) => {
    const dispatch = useAppDispatch();
    const [modalState, setModalState] = useState({
        isOpen: false,
        isLoading: false,
    });
    const [userBaseName, setUserBaseName] = useState<{
        basename: string | null;
        avatar: string | null;
    }>({
        avatar: null,
        basename: null,
    });
    const [updateUsername] = useUpdateUsernameMutation();

    const fetchBasenameData = useCallback(async (address: `0x${string}`) => {
        try {
            const basename = await getBasename(address);
            if (basename) {
                const avatar = await getBasenameAvatar(basename);
                return { basename, avatar };
            }
            return { basename: null, avatar: null };
        } catch (error) {
            console.error('Error fetching basename:', error);
            return { basename: null, avatar: null };
        }
    }, []);

    const handleEditClick = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: true }));
    }, []);

    const handleUsernameChange = useCallback(
        async (newUsername: string) => {
            if (!newUsername.trim() || newUsername === user?.username) {
                setModalState(prev => ({ ...prev, isOpen: false }));
                return;
            }

            try {
                if (!user.id) {
                    throw new Error('User ID is required');
                }

                setModalState(prev => ({ ...prev, isLoading: true }));
                const result = await updateUsername({
                    userId: user.id,
                    username: newUsername.trim(),
                }).unwrap();

                if (result.status === 'success') {
                    dispatch(updateUser({ username: newUsername.trim() }));
                    setModalState(prev => ({ ...prev, isOpen: false }));
                } else {
                    throw new Error(result.message || 'Failed to update username');
                }
            } catch (error) {
                throw error;
            } finally {
                setModalState(prev => ({ ...prev, isLoading: false }));
            }
        },
        [user?.id, user?.username, dispatch, updateUsername]
    );

    const handleCancelEdit = useCallback(() => {
        setModalState(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Memoize user info to prevent unnecessary recalculations
    const userInfo = useMemo(
        () => ({
            displayName:
                userBaseName.basename || user?.username || formatAddress(user?.walletAddress),
            initials: (userBaseName.basename || user?.username || user?.walletAddress || '')
                .slice(0, 2)
                .toUpperCase(),
        }),
        [user?.username, user?.walletAddress, userBaseName]
    );

    // Use a separate effect for basename fetching
    useEffect(() => {
        let mounted = true;

        async function loadBasenameData() {
            if (user?.walletAddress) {
                const data = await fetchBasenameData(user.walletAddress as `0x${string}`);
                if (mounted) {
                    setUserBaseName(data);
                }
            }
        }

        loadBasenameData();

        return () => {
            mounted = false;
        };
    }, [user?.walletAddress, fetchBasenameData]);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800"
                        disabled={modalState.isLoading}
                    >
                        <Avatar className="h-6 w-6">
                            {userBaseName.avatar ? (
                                <AvatarImage src={userBaseName.avatar} alt={userInfo.displayName} />
                            ) : (
                                <AvatarFallback>{userInfo.initials}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="h-1 w-1 rounded-full bg-green-500" />
                        <span className="text-sm text-zinc-100">
                            {modalState.isLoading ? 'Updating...' : userInfo.displayName}
                        </span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    align="end"
                    className="min-w-[144px] bg-zinc-900 p-2 border-none"
                >
                    {!userBaseName.basename && (
                        <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-zinc-100"
                            onClick={handleEditClick}
                            disabled={modalState.isLoading}
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
                                {userBaseName.basename ? 'Manage basename' : 'Buy basename'}
                            </span>
                            <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {!userBaseName.basename && (
                <UsernameModal
                    initialUsername={user?.username || ''}
                    onSave={handleUsernameChange}
                    onCancel={handleCancelEdit}
                    isOpen={modalState.isOpen}
                    isLoading={modalState.isLoading}
                />
            )}
        </>
    );
});

UserProfile.displayName = 'UserProfile';
export default UserProfile;
