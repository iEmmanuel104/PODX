'use client'

import { useState } from "react"
import VideoPreview from "@/components/join/videoPreview"
import UserInputForm from "@/components/join/user-input-form"
import Controls from "@/components/join/controls"
import WaitingScreen from "@/components/join/waiting-screen"
import Logo from "@/components/ui/logo"


const JoinSession: React.FC = () => {
    const [name, setName] = useState<string>('folajindayo.base.eth')
    const [isMuted, setIsMuted] = useState<boolean>(true)
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState<boolean>(false)
    const [isWaiting, setIsWaiting] = useState<boolean>(false)

    const handleJoinSession = () => {
        setIsWaiting(true)
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <div className='flex justify-center mb-8'>
                    <Logo />
                </div>

                <p className="text-center mb-8 text-lg">
                    You are about to join Base Live Build Session
                </p>

                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    <div className="w-full md:w-1/2 bg-[#1D1D1D] p-3.5 rounded-xl">
                        <VideoPreview isMuted={isMuted} />
                        <Controls isMuted={isMuted} setIsMuted={setIsMuted} />
                    </div>
                    {!isWaiting ? (
                        <UserInputForm
                            name={name}
                            setName={setName}
                            isBasenameConfirmed={isBasenameConfirmed}
                            handleJoinSession={handleJoinSession}
                        />
                    ) : (
                        <WaitingScreen />
                    )}
                </div>
            </div>
        </div>
    )
}

export default JoinSession