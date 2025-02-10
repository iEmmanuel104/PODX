import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Info, Sparkles, Trophy } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Fire from '@/public/icons/Fire';
import Farcaster from '@/public/icons/socials/Farcaster';
import X from '@/public/icons/socials/X';
import { UserInfo } from '@/store/user/types';

interface StreakDialogProps {
    user?: UserInfo;
    onToggleCreateSession: () => void;
}


export function StreakDialog({ user, onToggleCreateSession }: StreakDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [animatedStreak, setAnimatedStreak] = useState(0);

    // Calculate streak status and messages
    const streakInfo = useMemo(() => {
        const currentStreak = user?.streak?.currentStreak || 0;
        const longestStreak = user?.streak?.longestStreak || 0;
        const totalPoints = user?.streak?.totalPoints || 0;

        // Different states and their messages
        if (currentStreak === 0 && longestStreak === 0) {
            return {
                status: 'new',
                buttonText: 'Begin your streak! 🚀',
                message:
                    "Ready to start your creator's journey? Host or join a session to kick off your streak!",
                streakText: 'Start your first streak',
                icon: <Sparkles className="w-5 h-5 text-[#DDB958]" />,
            };
        }

        if (currentStreak === 0 && longestStreak > 0) {
            return {
                status: 'break',
                buttonText: 'Restart your streak 🔥',
                message: `You've achieved a ${longestStreak}-day streak before! Ready to break your record?`,
                streakText: 'Time to rebuild! 🔄',
                icon: <Trophy className="w-5 h-5 text-[#DDB958]" />,
            };
        }

        if (currentStreak === longestStreak && currentStreak > 0) {
            return {
                status: 'peak',
                buttonText: 'Keep it going! 🏆',
                message: `You're on fire! This is your best streak ever. Can you push it further?`,
                streakText: `${currentStreak} day peak streak! 🔥`,
                icon: <Fire />,
            };
        }

        return {
            status: 'active',
            buttonText: 'Continue streak 🎯',
            message: `Keep the momentum going! You're building something special.`,
            streakText: `${currentStreak} day streak! 🔥`,
            icon: <Fire />,
        };
    }, [user?.streak]);

    useEffect(() => {
        if (isOpen && user?.streak?.currentStreak) {
            const duration = 1000;
            const steps = 20;
            const increment = user.streak.currentStreak / steps;
            let current = 0;

            const timer = setInterval(() => {
                current += increment;
                if (current >= user.streak.currentStreak) {
                    setAnimatedStreak(user.streak.currentStreak);
                    clearInterval(timer);
                } else {
                    setAnimatedStreak(Math.floor(current));
                }
            }, duration / steps);

            return () => clearInterval(timer);
        }
    }, [isOpen, user?.streak?.currentStreak]);

    const handleShare = (platform: 'x' | 'warpcast') => {
        const { status } = streakInfo;
        let text = '';

        if (status === 'peak') {
            text = `🏆 Just hit my best streak ever on PodX - ${user?.streak?.currentStreak} days! Join me in building the future of web3 streaming.`;
        } else if (status === 'active') {
            text = `🔥 ${user?.streak?.currentStreak} days and counting on PodX! Total points: ${user?.streak?.totalPoints}. The web3 streaming revolution is here!`;
        } else {
            text = `🚀 Just discovered PodX - the future of web3 streaming and creator empowerment! Join me on this journey.`;
        }

        const url = 'https://podx.fun';

        if (platform === 'x') {
            window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
            );
        } else if (platform === 'warpcast') {
            window.open(`https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`);
        }
    };

    const handleAction = () => {
        setIsOpen(false);
        onToggleCreateSession();
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <motion.div
                    className="w-full max-w-[300px] sm:max-w-[325px] mx-auto cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="rounded-full bg-gradient-to-r from-[#552FC9] to-[#D7B35D] p-[1px] transition-all duration-300 hover:from-[#6032F6] hover:to-[#DDB958]">
                        <Button
                            variant="ghost"
                            className="w-full flex justify-between items-center rounded-full bg-[#151515] text-white text-xs sm:text-sm tracking-wider py-[6px] px-[20px] hover:bg-[#151515]/90 transition-all"
                        >
                            <motion.div
                                className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px]"
                                animate={
                                    streakInfo.status === 'active' || streakInfo.status === 'peak'
                                        ? {
                                              rotate: [0, 20, 0],
                                              scale: [1, 1.2, 1],
                                          }
                                        : {}
                                }
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {streakInfo.icon}
                            </motion.div>
                            <span className="mx-2">{streakInfo.streakText}</span>
                            <div className="h-[16px] w-[16px] sm:h-[18px] sm:w-[18px]">
                                <Info />
                            </div>
                        </Button>
                    </div>
                </motion.div>
            </DialogTrigger>

            <AnimatePresence>
                {isOpen && (
                    <DialogContent className="fixed left-[50%] top-[50%] w-[90vw] max-w-[425px] translate-x-[-50%] translate-y-[-50%] bg-[#1E1E1E] text-white border border-[#2E2E2E] p-0 rounded-[10px] sm:mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="p-5 sm:p-6 flex flex-col items-center gap-4"
                        >
                            <motion.div
                                className="h-[52px] w-[52px]"
                                animate={
                                    streakInfo.status === 'active' || streakInfo.status === 'peak'
                                        ? {
                                              scale: [1, 1.2, 1],
                                              rotate: [0, 10, -10, 0],
                                          }
                                        : {
                                              scale: [1, 1.1, 1],
                                          }
                                }
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                }}
                            >
                                {streakInfo.icon}
                            </motion.div>

                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-center"
                            >
                                <DialogTitle className="text-4xl sm:text-6xl font-bold mb-3">
                                    {animatedStreak} {animatedStreak === 1 ? 'day' : 'days'}
                                </DialogTitle>
                                <div className="text-white text-base sm:text-lg">
                                    Creator Streak
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex flex-col items-center gap-3 mt-2 w-full"
                            >
                                <div className="text-center space-y-3 w-full">
                                    {user?.streak?.longestStreak &&
                                        user.streak.longestStreak > 0 && (
                                            <div className="text-[#DDB958] font-semibold text-base sm:text-lg">
                                                Best Streak: {user.streak.longestStreak} days 🏆
                                            </div>
                                        )}
                                    <div className="text-[#A3A3A3] text-base">
                                        Total Creator Points: {user?.streak?.totalPoints || 0} ⭐️
                                    </div>
                                </div>

                                <div className="text-center text-[#A3A3A3] mt-4 mb-6 max-w-[280px] mx-auto text-sm sm:text-base">
                                    {streakInfo.message}
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="flex gap-3 w-full"
                            >
                                <Button
                                    className="flex-1 bg-[#DDB958] hover:bg-[#DDB958]/90 text-black rounded-[10px] py-2.5 sm:py-3 px-4 sm:px-5 w-1/2 transition-all duration-300 text-sm sm:text-base font-medium"
                                    onClick={handleAction}
                                >
                                    {streakInfo.buttonText}
                                </Button>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="bg-[#2E2E2E] border-[#2E2E2E] hover:bg-[#2E2E2E]/80 hover:border-[#2E2E2E] py-2.5 sm:py-3 px-4 sm:px-5 text-white hover:text-white rounded-[10px] w-1/2 transition-all duration-300 text-sm sm:text-base font-medium"
                                        >
                                            Share
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        className="bg-[#1E1E1E] border-[#2E2E2E]"
                                        align="end"
                                        sideOffset={5}
                                    >
                                        <DropdownMenuItem
                                            className="text-white hover:bg-[#2E2E2E] cursor-pointer gap-3 transition-colors duration-200 py-2.5"
                                            onClick={() => handleShare('x')}
                                        >
                                            <X />
                                            <span>Share to X</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-white hover:bg-[#2E2E2E] cursor-pointer gap-3 transition-colors duration-200 py-2.5"
                                            onClick={() => handleShare('warpcast')}
                                        >
                                            <Farcaster />
                                            <span>Share to Warpcast</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </motion.div>
                        </motion.div>
                    </DialogContent>
                )}
            </AnimatePresence>
        </Dialog>
    );
}
