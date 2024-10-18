import { useState } from 'react';
import { useAuthSigner } from '@/hooks/useAuthSigner';
import { DialogContent, DialogDescription } from "@/components/ui/dialog";
import { useUpdateUsernameMutation } from '@/store/api/userApi';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';

export function UserInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { signMessage, getAddress } = useAuthSigner();
    const [updateUsername] = useUpdateUsernameMutation();
    const dispatch = useAppDispatch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const message = `Update username to: ${username}`;
            const signature = await signMessage(message);
            const address = await getAddress();
            const result = await updateUsername({ username, signature, message, address }).unwrap();
            dispatch(setUser(result.data));
            onClose();
        } catch (error) {
            console.error("Failed to update username:", error);
            setError("Failed to update username. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent>
            <DialogDescription>
                Please enter your new username below.
            </DialogDescription>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter new username"
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Username'}
                </button>
            </form>
            {error && <p>{error}</p>}
        </DialogContent>
    );
}
