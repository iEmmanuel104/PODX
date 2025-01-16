import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateUsernameMutation } from "@/store/api/userApi";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import styles from "./styles.module.scss";
import DotPattern from "../ui/dot-pattern";
import { cn } from "@/lib/utils";

interface UsernameUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialUsername: string;
    onUpdate: (newUsername: string) => void;
}

export default function UserInfoModal({ isOpen, onClose, initialUsername, onUpdate }: UsernameUpdateModalProps) {
    const [username, setUsername] = useState(initialUsername);
    const [updateUsername] = useUpdateUsernameMutation();
    const userId = useAppSelector((state) => state.user.user?.id);
    const dispatch = useAppDispatch();
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userId) {
            setIsLoading(true);
            try {
                const result = await updateUsername({ userId, username }).unwrap();
                if (result.data) {
                    dispatch(updateUser({ username: result.data.username }));
                    onUpdate(result.data.username);
                    onClose();
                }
            } catch (error) {
                toast.error("Username update error");
                console.error("Failed to update username:", error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={styles.dialogContent}>
                <DotPattern
                    width={20}
                    height={20}
                    cx={2}
                    cy={2}
                    cr={1}
                    className={cn(
                        "[mask-image:radial-gradient(to_bottom_right,white,transparent,transparent)] rounded-[20px] top-[6px] left-[8px] px-[10px]"
                    )}
                />
                <DialogHeader className="z-10">
                    <DialogTitle className="text-xl font-medium">Set your username</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 z-10 bg-transparent">
                    <div className="flex flex-col gap-[32px]">
                        <label htmlFor="username" className="text-sm text-[#8c8c8c] mb-2">
                            Pick a unique username
                        </label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full border border-[#3C3C3C] bg-[#2B2B2B] rounded-[10px] px-[16px] py-[10px] text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6] text-white placeholder-[#6C6C6C]"
                            placeholder="Enter username"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="bg-[#2C2C2C] text-white px-4 py-2 rounded-[10px] hover:bg-[#3C3C3C] transition-all duration-300 ease-in-out text-sm font-medium"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#6032F6] text-white px-4 py-2 rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save"
                            )}
                        </Button>
                    </div>
                </form>
                <div className="absolute w-[217px] h-[217px] left-[330px] top-[-89.58px] bg-[rgba(53,53,53)] blur-[50px]"></div>
            </DialogContent>
        </Dialog>
    );
}
