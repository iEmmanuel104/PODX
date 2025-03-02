import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

interface ProofOfAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionTitle: string;
    proofData: {
        timestamp: string;
        duration: string;
        sessionId: string;
    };
}

const ProofOfAttendanceModal: React.FC<ProofOfAttendanceModalProps> = ({
    isOpen,
    onClose,
    sessionTitle,
    proofData,
}) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="box-border flex flex-col justify-end items-start p-6 gap-6 isolate w-[340px] h-[288px] bg-[#1D1D1D] rounded-[20px] relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#3E3E3E_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

                <DialogHeader className="items-start relative">
                    <div className="w-12 h-12 rounded-full bg-[#6032F6]/20 flex items-center justify-center mb-6">
                        <Image
                            src="/icons/proof-icon.png"
                            alt="Proof of attendance"
                            width={24}
                            height={24}
                            className="text-[#6032F6]"
                        />
                    </div>
                    <DialogTitle className="text-[24px] font-[500] text-left text-[#D4D4D4]">
                        Thank you for your participation!
                    </DialogTitle>
                    <p className="text-[16px] text-[#848484] text-left mt-4">
                        You've received a proof of attendance
                    </p>
                </DialogHeader>

                <div className="space-y-6 w-full">
                    <div className="flex gap-4 justify-start">
                        <button
                            onClick={onClose}
                            className="w-[138px] h-[36px] bg-[#292929] border border-[#3E3E3E] rounded-[10px] text-[#D4D4D4] text-[16px] flex items-center justify-center"
                        >
                            Close
                        </button>
                        <button className="w-[138px] h-[36px] bg-[#D5B255] rounded-[10px] text-[#151515] text-[16px] flex items-center justify-center">
                            Check it out
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProofOfAttendanceModal;
