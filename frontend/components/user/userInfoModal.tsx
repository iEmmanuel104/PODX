import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUpdateUsernameMutation } from "@/store/api/userApi";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { updateUser } from "@/store/slices/userSlice";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

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
            <DialogContent className="bg-[#1E1E1E] text-white rounded-lg p-6 w-full max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="username" className="block text-[#A3A3A3] mb-2">
                            Username
                        </label>
                        <Input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#6032F6] text-white placeholder-[#6C6C6C]"
                            placeholder="Enter your new username"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button
                            type="button"
                            onClick={onClose}
                            className="bg-[#2C2C2C] text-white px-4 py-2 rounded-md hover:bg-[#3C3C3C] transition-all duration-300 ease-in-out text-sm font-medium"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-[#6032F6] text-white px-4 py-2 rounded-md hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}