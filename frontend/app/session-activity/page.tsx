// app/session-activity/page.tsx
'use client';

import { SessionActivity } from '@/components/pod/sessionActivity';
import { useAppSelector } from '@/store/hooks';

export default function Page() {
    const { isLoggedIn, user } = useAppSelector(state => state.user);

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#151515] text-white p-8 flex items-center justify-center">
                Please log in to view session activity
            </div>
        );
    }

    return <SessionActivity user={user} />;
}
