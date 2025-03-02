import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'react-hot-toast';
import { isAddress } from 'ethers';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface WithdrawModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWithdraw: (address: string, amount: string, currency: 'ETH' | 'USDC') => Promise<void>;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose, onWithdraw }) => {
    const [address, setAddress] = useState('');
    const [amount, setAmount] = useState('');
    const [currency, setCurrency] = useState<'ETH' | 'USDC'>('ETH'); // Default to ETH
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
            await onWithdraw(address, amount, currency);
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
            <DialogContent className="bg-[#151515] text-white">
                <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                    <DialogDescription>
                        Enter the external wallet address and the amount to withdraw.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c]"
                        placeholder="External Wallet Address"
                        value={address}
                        onChange={e => setAddress(e.target.value)}
                    />
                    <Input
                        className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c]"
                        placeholder={`Amount (${currency})`}
                        type="number"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                    />
                    <Select
                        value={currency}
                        onValueChange={(value: 'ETH' | 'USDC') => setCurrency(value)}
                    >
                        <SelectTrigger className="w-full bg-[#2C2C2C] rounded-[10px] px-4 py-2 border-[#3c3c3c]">
                            <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2C2C2C] border-[#3c3c3c]">
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="USDC">USDC</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button
                        className="w-full px-3 py-3 rounded-[10px] bg-[#6032F6] hover:bg-[#6D28D9] disabled:bg-gray-500"
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
