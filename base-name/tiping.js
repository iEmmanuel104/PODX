import { useFundWallet } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { base } from 'viem/chains';

const USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';

export class Tipping {
    constructor(privyWallet, checkWalletBalance, transferFromOrgWallet) {
        this.privyWallet = privyWallet;
        this.checkWalletBalance = checkWalletBalance;
        this.transferFromOrgWallet = transferFromOrgWallet;
        const { fundWallet } = useFundWallet();
        this.fundWallet = fundWallet;
        this.pendingTips = new Map();
    }

    async tip(recipientAddress, tipAmount, isNigerian) {
        if (!this.privyWallet.address) {
            throw new Error("Wallet not authenticated");
        }

        const tipKey = `${this.privyWallet.address}-${recipientAddress}-${tipAmount}`;
        if (this.pendingTips.has(tipKey)) {
            throw new Error("A tip with the same parameters is already in progress");
        }

        this.pendingTips.set(tipKey, true);

        try {
            const userBalance = await this.checkWalletBalance(this.privyWallet.address);
            const tipAmountWei = ethers.utils.parseUnits(tipAmount, 6); // Assuming USDC has 6 decimal places

            if (ethers.BigNumber.from(userBalance.USDC).lt(tipAmountWei)) {
                // User doesn't have enough USDC to tip
                const amountToFund = ethers.utils.formatUnits(
                    tipAmountWei.sub(ethers.BigNumber.from(userBalance.USDC)),
                    6
                );

                if (isNigerian) {
                    // Use org wallet to transfer funds
                    await this.transferFromOrgWallet(this.privyWallet.address, amountToFund);
                } else {
                    // Use Privy's funding feature
                    await this.fundWallet(this.privyWallet.address, {
                        chain: base,
                        asset: 'USDC',
                        amount: parseFloat(amountToFund)
                    });
                }

                // Wait for a short time to allow the funding transaction to be processed
                await new Promise(resolve => setTimeout(resolve, 5000));
            }

            // Now send the tip
            const usdcInterface = new ethers.utils.Interface([
                "function transfer(address to, uint256 amount) returns (bool)"
            ]);

            const data = usdcInterface.encodeFunctionData("transfer", [recipientAddress, tipAmountWei]);

            const transaction = {
                to: USDC_ADDRESS,
                data: data,
            };

            const txHash = await this.privyWallet.sendTransaction(transaction);
            console.log(`Tip of ${tipAmount} USDC sent to ${recipientAddress}. Transaction hash: ${txHash}`);
            return txHash;
        } catch (error) {
            console.error("Error sending tip:", error);
            throw error;
        } finally {
            this.pendingTips.delete(tipKey);
        }
    }
}

// Hook to use the Tipping class
export function useTipping(privyWallet, checkWalletBalance, transferFromOrgWallet) {
    const tipping = new Tipping(privyWallet, checkWalletBalance, transferFromOrgWallet);

    return {
        sendTip: async (recipientAddress, tipAmount, isNigerian) => {
            try {
                return await tipping.tip(recipientAddress, tipAmount, isNigerian);
            } catch (error) {
                console.error("Failed to send tip:", error);
                throw error;
            }
        }
    };
}
