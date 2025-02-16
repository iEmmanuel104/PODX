import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { isAddress } from 'ethers';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWithdraw: (address: string, amount: string) => Promise<void>;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onWithdraw }) => {
    const [address, setAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleWithdraw = async () => {
        if (!isAddress(address)) {
            toast.error('Invalid wallet address');
            return;
        }

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsLoading(true);
        try {
            await onWithdraw(address, amount);
            toast.success('Withdrawal successful!');
            onClose();
        } catch (error) {
            console.error('Error withdrawing funds:', error);
            toast.error('Failed to withdraw funds. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Enter the external wallet address and the amount to withdraw.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        placeholder="External Wallet Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />
                    <Input
                        placeholder="Amount (ETH)"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Button
                        className="w-full"
                        onClick={handleWithdraw}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Withdrawing...' : 'Withdraw'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};