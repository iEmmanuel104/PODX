import React, { useState } from 'react';
import { DollarSign, ChevronDown, X } from 'lucide-react';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import DotPattern from '../ui/dot-pattern';
import { cn } from '@/lib/utils';

interface ModalProps {
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-[#1E1E1E] p-6 rounded-[10px] w-full max-w-md">
            {children}
        </div>
    </div>
);

interface TipModalProps {
    selectedTipRecipient: StreamVideoParticipant | null;
    tipAmount: string;
    walletAddress: string;
    setTipAmount: (amount: string) => void;
    handleTip: () => void;
    onCancel: () => void;
    balance: string;
}

const TipModal: React.FC<TipModalProps> = ({
    selectedTipRecipient,
    tipAmount,
    setTipAmount,
    handleTip,
    walletAddress,
    onCancel,
    balance,
}) => {
    const [currency, setCurrency] = useState<'ETH' | 'USDC'>('USDC'); // State for selected currency
    const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility

    return (
        <Modal>
            {/* <DotPattern
                width={20}
                height={20}
                cx={2}
                cy={2}
                cr={1}
                className={cn(
                    '[mask-image:radial-gradient(to_bottom_right,white,transparent,transparent)] rounded-[20px] top-[6px] left-[5px] px-[10px] -z-10'
                )}
            /> */}
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Tip</h2>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Recipient Info */}
            <p className="text-white mb-4">{selectedTipRecipient?.name || walletAddress}</p>

            {/* Input Field and Tip Button */}
            <div className="flex items-center gap-2 mb-4">
                {/* Input Field */}
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Enter tip amount"
                        value={tipAmount}
                        onChange={(e) => setTipAmount(e.target.value)}
                        className="w-full bg-[#2C2C2C] text-white text-sm rounded-lg px-4 py-2.5 
                                   focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                    />
                    {/* Currency Dropdown */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center text-gray-400 hover:text-white transition-colors"
                        >
                            <span className="mr-1">{currency}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-20 bg-[#2C2C2C] rounded-lg shadow-lg">
                                <button
                                    onClick={() => {
                                        setCurrency('ETH');
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-white hover:bg-[#383838] rounded-t-lg"
                                >
                                    ETH
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrency('USDC');
                                        setIsDropdownOpen(false);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-white hover:bg-[#383838] rounded-b-lg"
                                >
                                    USDC
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tip Button */}
                <button
                    onClick={handleTip}
                    className="bg-[#7C3AED] text-white px-4 py-2.5 rounded-lg hover:bg-[#6D28D9] transition-colors"
                >
                    Tip
                </button>
            </div>

            {/* Balance Display */}
            <p className="text-white text-sm">Balance: {balance} {currency}</p>
        </Modal>
    );
};

export default TipModal;