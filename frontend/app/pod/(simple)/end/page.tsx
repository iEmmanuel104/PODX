'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function EndScreen() {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center h-full text-white p-8">
            <div className="w-full max-w-md flex flex-col items-center gap-8">
                <h1 className="text-2xl font-semibold mb-8">The session has ended</h1>
                <Button
                    onClick={() => router.push('/pod')}
                    className="bg-[#6032f6] hover:bg-[#4C28C4] text-white font-medium py-2 px-4 rounded-full w-full max-w-xs"
                >
                    Return to home screen
                </Button>
            </div>
        </div>
    );
}
