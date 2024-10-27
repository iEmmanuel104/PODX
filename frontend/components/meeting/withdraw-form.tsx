'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Modal } from './tips'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

interface WithdrawFormProps {
    onClose: () => void;
}

export default function WithdrawForm({ onClose }: WithdrawFormProps) {
    const [amount, setAmount] = useState('')
    const [address, setAddress] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        console.log('Withdraw', { amount, address })
        onClose()
    }

    return (
        <Dialog open={false} onOpenChange={()=>{}}>
            <DialogContent className="bg-[#121212] border border-[#6032f6] text-white">
                <DialogHeader>
                    <DialogTitle>Withdraw</DialogTitle>
                </DialogHeader>
                <form onSubmit={()=>{}} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="network">Network</Label>
                        <Select defaultValue="base">
                            <SelectTrigger className="w-full bg-[#1e1e1e] border-0 text-white rounded-[10px]">
                                <SelectValue placeholder="Select network" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e1e1e] border-[#2E2E2E] text-white">
                                <SelectItem value="base">Base</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter withdrawal amount"
                            className="bg-[#1e1e1e] border-0 text-white rounded-[10px] placeholder-gray-500 focus:ring-2 focus:ring-[#6032f6]"
                        />
                        <p className="text-sm text-gray-400">Balance: 1 ETH</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Wallet address</Label>
                        <Input
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter wallet address or basename"
                            className="bg-[#1e1e1e] border-0 text-white rounded-[10px] placeholder-gray-500 focus:ring-2 focus:ring-[#6032f6]"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-[#6032f6] text-white hover:bg-[#4C28C4]">
                        Withdraw
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}