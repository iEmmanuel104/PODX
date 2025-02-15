"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Tip {
    from: string
    amount: string
    profileImage?: string
}

interface TipNotificationProps {
    tip: Tip
    onClose: () => void
    onAppreciate: () => void
}

export default function TipNotification({ tip, onClose, onAppreciate }: TipNotificationProps) {
    return (
        <div className="fixed bottom-4 left-4 animate-in slide-in-from-bottom-4">
            <div className="bg-[#1C1C1C] rounded-xl p-4 min-w-[420px] shadow-lg border border-zinc-800">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Image
                                src={tip.profileImage || "/images/default-avatar.png"}
                                alt="Profile"
                                width={36}
                                height={36}
                                className="rounded-full"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-[#6366F1] rounded-full w-4 h-4 flex items-center justify-center">
                                <span className="text-[10px]">1</span>
                            </div>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-white text-base font-medium">You just got tipped 🎉</p>
                            <p className="text-sm">
                                <span className="text-[#B3B3B3]">{tip.from}</span> just tipped you{" "}
                                <span className="text-[#DDB958]">{tip.amount}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={onAppreciate}
                            className="bg-[#6032F6] text-white rounded-full px-6 py-1 text-sm font-medium"
                        >
                            Appreciate
                        </Button>
                        <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

