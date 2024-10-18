import { useAuthSigner } from '@/hooks/useAuthSigner';
import { useUpdateUsernameMutation } from '@/store/api/userApi';

export async function updateUsername(newUsername) {
    const { signMessage, getAddress } = useAuthSigner();
    const [updateUsernameMutation] = useUpdateUsernameMutation();

    try {
        const message = `Update username to: ${newUsername}`;
        const signature = await signMessage(message);
        const address = await getAddress();

        const result = await updateUsernameMutation({
            username: newUsername,
            signature,
            message,
            address
        }).unwrap();

        return result;
    } catch (error) {
        console.error('Error updating username:', error);
        throw error;
    }
}
