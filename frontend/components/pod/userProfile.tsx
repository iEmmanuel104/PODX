import { useState, useMemo, useCallback, memo, useEffect } from "react"
import { Edit3, ArrowUpRight } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { updateUser } from "@/store/slices/userSlice"
import { UsernameModal } from "./username-modal"
import { getBasename, getBasenameAvatar } from "@/app/apis/basenames"

interface UserProfileProps {
    user: {
        username?: string
        walletAddress: string
        walletClientType?: string
    }
}

const formatAddress = (addr: string): string =>
    addr ? (addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`) : ""

const UserProfile = memo<UserProfileProps>(({ user }) => {
    const dispatch = useAppDispatch()
    const [isEditingUsername, setIsEditingUsername] = useState(false)
    const [userBaseName, setUserBaseName] = useState<{ basename: string | null, avatar: string | null }>({
        avatar: null,
        basename: null
    })

    const fetchBasenameData = useCallback(async (address: `0x${string}`) => {
        try {
            const basename = await getBasename(address)
            console.log("basename", basename)
            if (basename) {
                const avatar = await getBasenameAvatar(basename)
                console.log("avatar", avatar)
                setUserBaseName({ basename, avatar })
            }
        } catch (error) {
            console.error('Error fetching basename:', error)
            setUserBaseName({ basename: null, avatar: null })
        }
    }, [])

    useEffect(() => {
        if (user?.walletAddress) {
            fetchBasenameData(user.walletAddress as `0x${string}`)
        }
    }, [user?.walletAddress, fetchBasenameData])

    const userInfo = useMemo(
        () => ({
            displayName: userBaseName.basename || user?.username || formatAddress(user?.walletAddress),
            initials: (userBaseName.basename || user?.username || user?.walletAddress || "")
                .slice(0, 2)
                .toUpperCase(),
        }),
        [user, userBaseName],
    )

    const handleEditClick = useCallback(() => {
        setIsEditingUsername(true)
    }, [])

    const handleUsernameChange = useCallback(
        (newUsername: string) => {
            if (newUsername.trim() && newUsername !== user?.username) {
                dispatch(updateUser({ username: newUsername.trim() }))
            }
            setIsEditingUsername(false)
        },
        [user?.username, dispatch],
    )

    const handleCancelEdit = useCallback(() => {
        setIsEditingUsername(false)
    }, [])

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 transition-colors hover:bg-zinc-800">
                        <Avatar className="h-6 w-6">
                            {userBaseName.avatar ? (
                                <AvatarImage src={userBaseName.avatar} alt={userInfo.displayName} />
                            ) : (
                                <AvatarFallback>{userInfo.initials}</AvatarFallback>
                            )}
                        </Avatar>
                        <div className="h-1 w-1 rounded-full bg-green-500" />
                        <span className="text-sm text-zinc-100">{userInfo.displayName}</span>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[144px] bg-zinc-900 p-2 border-none">
                    {!userBaseName.basename && (
                        <DropdownMenuItem
                            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-zinc-100"
                            onSelect={(e) => {
                                e.preventDefault()
                                handleEditClick()
                            }}
                        >
                            <Edit3 className="h-4 w-4" />
                            <span>Edit name</span>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2">
                        <span className="bg-gradient-to-br from-[#552FC9] to-[#D7B35D] bg-clip-text text-transparent">
                            {userBaseName.basename ? 'Manage basename' : 'Buy basename'}
                        </span>
                        <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            {!userBaseName.basename && (
                <UsernameModal
                    initialUsername={user?.username || ""}
                    onSave={handleUsernameChange}
                    onCancel={handleCancelEdit}
                    isOpen={isEditingUsername}
                />
            )}
        </>
    )
})

UserProfile.displayName = "UserProfile"
export default UserProfile