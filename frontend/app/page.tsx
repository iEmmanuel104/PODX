'use client';

import { useState } from 'react'
import { Mail, Phone, Wallet } from 'lucide-react'

export default function Home() {
  const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone' | 'wallet' | null>(null)

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-16">
          Pod<span className="text-[#7C3AED]">X</span>
        </h1>

        <h2 className="text-4xl font-bold mb-4">Privy SDK</h2>

        <p className="text-xl text-center mb-12">
          Email, Phone and<br />Connect Wallet
        </p>

        <div className="w-full space-y-4">
          <button
            className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors ${selectedMethod === 'email' ? 'bg-[#7C3AED]' : 'bg-[#2C2C2C] hover:bg-[#3C3C3C]'
              }`}
            onClick={() => setSelectedMethod('email')}
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </button>

          <button
            className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors ${selectedMethod === 'phone' ? 'bg-[#7C3AED]' : 'bg-[#2C2C2C] hover:bg-[#3C3C3C]'
              }`}
            onClick={() => setSelectedMethod('phone')}
          >
            <Phone className="w-5 h-5 mr-2" />
            Continue with Phone
          </button>

          <button
            className={`w-full py-3 px-4 rounded-md flex items-center justify-center transition-colors ${selectedMethod === 'wallet' ? 'bg-[#7C3AED]' : 'bg-[#2C2C2C] hover:bg-[#3C3C3C]'
              }`}
            onClick={() => setSelectedMethod('wallet')}
          >
            <Wallet className="w-5 h-5 mr-2" />
            Connect Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
