import { FC } from 'react';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface CustomToastProps {
    message: string;
    type: 'error' | 'success' | 'loading';
}

export const CustomToast: FC<CustomToastProps> = ({ message, type }) => {
    const Icon = type === 'error' ? AlertCircle : type === 'success' ? CheckCircle : Loader2;
    const bgColor = type === 'error' ? 'bg-red-500/10' : type === 'success' ? 'bg-green-500/10' : 'bg-blue-500/10';
    
    return (
        <div className="fixed bottom-4 left-4 animate-in slide-in-from-bottom-4">
            <div className={`bg-[#1C1C1C] rounded-xl p-4 min-w-[420px] shadow-lg border border-zinc-800 ${bgColor}`}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Icon className={`w-6 h-6 ${type === 'loading' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-white text-base font-medium">{message}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}; 