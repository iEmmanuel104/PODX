// components/user/walletOperations.tsx
import React, { useMemo, useState, memo } from 'react';
import { useWalletOperations } from '@/hooks/useWalletOps';
import { Wallet, RefreshCcw, Download, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useBalance } from 'wagmi';
import { WalletOperationsProps } from '@/types';

const formatAddress = (addr: string): string =>
    addr.length < 10 ? addr : `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const WalletOperations = memo<WalletOperationsProps>(
    ({ state, setState, user, onWithdrawClick, onWarningConfirm }) => {
        const [isBalanceHidden, setIsBalanceHidden] = useState(false);
        const { handleWithdraw, handleExportWallet, getActiveWalletAddress } =
            useWalletOperations();

        // Memoize active wallet address
        const activeWalletAddress = useMemo(
            () => getActiveWalletAddress(),
            [getActiveWalletAddress]
        );

        // Memoize balance query
        const { data: balance } = useBalance({
            address: activeWalletAddress as `0x${string}`,
        });

        // Memoize display balance calculation
        const displayBalance = useMemo(() => {
            if (!balance) return '0.0000';
            const formattedBalance = Number(balance.value) / 1e18;
            return formattedBalance.toFixed(4);
        }, [balance]);

        const handleWithdrawSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setState(prev => ({ ...prev, isWithdrawOpen: false }));
            const notification = toast.loading('Withdrawing...');

            try {
                await handleWithdraw(
                    state.address,
                    state.amount,
                    hash => {
                        toast.success(`Withdrawal successful! Transaction hash: ${hash}`, {
                            id: notification,
                        });
                        setState(prev => ({ ...prev, amount: '', address: '' }));
                    },
                    error =>
                        toast.error(`Withdrawal failed: ${error.message}`, { id: notification })
                );
            } catch (error) {
                console.error('Withdrawal error:', error);
                toast.error(error instanceof Error ? error.message : 'Withdrawal failed', {
                    id: notification,
                });
            }
        };

        const handleExport = async () => {
            try {
                await handleExportWallet(
                    () => toast.success('Wallet exported successfully'),
                    error => toast.error(`Export failed: ${error.message}`)
                );
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Export failed');
            }
        };

        // Memoize the wallet header section
        const WalletHeader = useMemo(
            () => (
                <div className="px-3 py-2 border-b border-[#2E2E2E]">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-[#DDB958] flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-xs text-[#A3A3A3] truncate w-36">
                                    {formatAddress(user.walletAddress)}
                                </p>
                                <Button
                                    variant="ghost"
                                    className="p-1 h-auto hover:bg-white/5"
                                    onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                                >
                                    {isBalanceHidden ? (
                                        <EyeOff className="h-3 w-3 text-white/60" />
                                    ) : (
                                        <Eye className="h-3 w-3 text-white/60" />
                                    )}
                                </Button>
                            </div>
                            <div className="flex items-center">
                                <p className="text-sm font-medium mr-1">Balance</p>
                                <div className="bg-[#6032F6] rounded-full px-2 py-0.5 text-xs">
                                    {isBalanceHidden ? '****' : `${displayBalance} ETH`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ),
            [user.walletAddress, isBalanceHidden, displayBalance]
        );

        return (
            <>
                {WalletHeader}

                <DropdownMenuItem
                    onSelect={onWithdrawClick}
                    className="flex items-center px-3 py-2 cursor-pointer"
                >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    <span>Withdraw funds</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    className="flex items-center px-3 py-2 cursor-pointer"
                    onSelect={handleExport}
                >
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export wallet</span>
                </DropdownMenuItem>

                {/* Warning Dialog */}
                <Dialog
                    open={state.isWarningOpen}
                    onOpenChange={open => setState(prev => ({ ...prev, isWarningOpen: open }))}
                >
                    <DialogContent className="bg-[#1d1d1d] border-0 text-white max-w-[320px] sm:rounded-3xl rounded-2xl">
                        <div className="flex flex-col items-center text-center space-y-4 py-4">
                            <AlertTriangle className="h-12 w-12 text-yellow-500" />
                            <p className="text-lg font-semibold">
                                This wallet only supports Base chain for now, your withdrawal would
                                be in the Base Network
                            </p>
                        </div>
                        <DialogFooter className="sm:justify-center">
                            <Button
                                className="w-full bg-[#6032f6] hover:bg-[#4C28C4] text-white rounded-xl py-6"
                                onClick={onWarningConfirm}
                            >
                                I understand.
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Withdraw Dialog */}
                <Dialog
                    open={state.isWithdrawOpen}
                    onOpenChange={open => setState(prev => ({ ...prev, isWithdrawOpen: open }))}
                >
                    <DialogContent className="bg-[#1D1D1D] sm:rounded-3xl text-white p-6">
                        <DialogHeader className="px-4 py-4">
                            <DialogTitle>Withdraw</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleWithdrawSubmit} className="space-y-8 px-4 pb-6">
                            {/* Form content here */}
                        </form>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

WalletOperations.displayName = 'WalletOperations';
export default WalletOperations;
