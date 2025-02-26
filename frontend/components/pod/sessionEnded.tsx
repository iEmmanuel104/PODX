'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Logo from '@/public/images/icons/Logo';

export default function SessionEnded() {
    const [rating, setRating] = useState(3);

    return (
        <div className="min-h-screen bg-[#1C1C1C] flex flex-col items-center justify-between p-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M0 0h1v1H0z' fill='%23FFF'/%3E%3C/svg%3E")`,
                    backgroundSize: '50px 50px',
                }}
            />

            {/* Logo */}
            <div className="w-[180px] h-[43px]">
                <Logo />
            </div>

            {/* Main Content */}
            <div className="flex flex-col items-center gap-4 text-center">
                <h1 className="text-2xl text-white font-medium mb-4">This session has ended</h1>
                <Button
                    variant="default"
                    className="bg-[#6C5DD3] hover:bg-[#5648B3] text-white px-8"
                >
                    Back home
                </Button>
            </div>

            {/* Feedback Section */}
            <div className="w-full max-w-md flex flex-col items-center gap-2">
                <h2 className="text-white text-lg font-medium">
                    Help us improve our product for you
                </h2>
                <p className="text-gray-400 text-sm mb-2">How was your session experience</p>

                {/* Star Rating */}
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                        <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                            />
                        </button>
                    ))}
                </div>

                {/* Proof of Attendance */}
                <div className="mt-8 flex items-center gap-2 bg-black/30 rounded-full px-4 py-2">
                    <span className="text-white text-sm">
                        You've received a proof of attendance
                    </span>
                    <Button variant="ghost" className="text-[#6C5DD3] hover:text-[#5648B3] p-0">
                        View
                    </Button>
                </div>
            </div>
        </div>
    );
}
