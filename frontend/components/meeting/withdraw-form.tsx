'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Modal } from './tips'

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
        <Modal>
            <div className="bg-[#121212] p-6 rounded-lg border border-[#6032f6] w-full max-w-md mx-auto">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-6">Withdraw</h2>

                    <div className="space-y-2">
                        <label htmlFor="network" className="block text-sm font-medium text-gray-400">
                            Network
                        </label>
                        <div className="relative">
                            <select
                                id="network"
                                className="block w-full bg-[#1e1e1e] border-0 text-white rounded-md py-2.5 pl-10 pr-10 appearance-none focus:ring-2 focus:ring-[#6032f6]"
                                defaultValue="base"
                            >
                                <option value="base">Base</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <div className="w-4 h-4 rounded-full bg-[#6032f6]"></div>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-400">
                            Amount
                        </label>
                        <input
                            type="text"
                            id="amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter withdrawal amount"
                            className="block w-full bg-[#1e1e1e] border-0 text-white rounded-md py-2 px-3 placeholder-gray-500 focus:ring-2 focus:ring-[#6032f6]"
                        />
                        <p className="text-sm text-gray-400">Balance: 1 ETH</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="address" className="block text-sm font-medium text-gray-400">
                            Wallet address
                        </label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Enter wallet address or basename"
                            className="block w-full bg-[#1e1e1e] border-0 text-white rounded-md py-2 px-3 placeholder-gray-500 focus:ring-2 focus:ring-[#6032f6]"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-[#6032f6] text-white rounded-md py-2 px-4 hover:bg-[#4C28C4] transition-colors duration-200"
                    >
                        Withdraw
                    </button>
                </form>
            </div>
        </Modal>
    )
}