import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TipModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipient: string;
    onTip: (amount: string) => void;
}

const TipModal: React.FC<TipModalProps> = ({ isOpen, onClose, recipient, onTip }) => {
    const [tipAmount, setTipAmount] = useState("");

    const handleTip = () => {
        onTip(tipAmount);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-gray-800 text-white">
                <DialogHeader>
                    <DialogTitle>Tip {recipient}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex">
                        <Input
                            type="text"
                            placeholder="Enter Tip in USDC"
                            value={tipAmount}
                            onChange={(e) => setTipAmount(e.target.value)}
                            className="flex-1 mr-2"
                        />
                        <Button onClick={handleTip}>Tip</Button>
                    </div>
                    <p className="text-gray-400">Balance: 100 USDC</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TipModal;
