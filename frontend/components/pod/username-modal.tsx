'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface UsernameModalProps {
    initialUsername: string;
    onSave: (username: string) => Promise<void>;
    onCancel: () => void;
    isOpen: boolean;
    isLoading?: boolean;
}

interface NotificationProps {
    message: string;
    type: 'error' | 'success';
}

const Notification = ({ message, type }: NotificationProps) => (
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
);

export function UsernameModal({
    initialUsername,
    onSave,
    onCancel,
    isOpen,
    isLoading,
}: UsernameModalProps) {
    const [username, setUsername] = React.useState(initialUsername);
    const [notification, setNotification] = React.useState<NotificationProps | null>(null);

    const handleSave = async () => {
        try {
            setNotification(null);
            await onSave(username);
            setNotification({
                type: 'success',
                message: 'Username updated successfully',
            });
            // Auto close after success
            setTimeout(() => {
                onCancel();
            }, 1500);
        } catch (error) {
            setNotification({
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to update username',
            });
        }
    };

    React.useEffect(() => {
        if (!isOpen) {
            setNotification(null);
            setUsername(initialUsername);
        }
    }, [isOpen, initialUsername]);

    return (
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                if (!open) onCancel();
            }}
        >
            <DialogContent className="sm:max-w-md bg-[#1d1d1d] border-0 rounded-lg">
                <DialogHeader>
                    <DialogTitle className="text-[20px] text-white">Set your username</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <p className="text-[#7b7b7b] text-[14px]">Pick a unique username</p>
                    <div className="space-y-2">
                        <div className="relative">
                            <Input
                                id="username"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="bg-[#292929] border-0 text-white px-4 py-2.5 rounded-[10px]"
                                placeholder="Enter username"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="text-right">
                            <button
                                className="text-[#d5b255] hover:text-[#d5b255]/80 text-sm underline"
                                disabled={isLoading}
                            >
                                Ask AI to suggest
                            </button>
                        </div>
                    </div>
                    {notification && (
                        <div className="mt-2">
                            <Notification {...notification} />
                        </div>
                    )}
                </div>
                <DialogFooter className="gap-2 sm:gap-2 mt-2">
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="bg-[#3c3c3c] hover:bg-[#3c3c3c]/90 text-white border-0"
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSave}
                        className="bg-[#6032f6] hover:bg-[#6032f6]/90 text-white"
                        disabled={isLoading || !username.trim() || username === initialUsername}
                    >
                        {isLoading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
