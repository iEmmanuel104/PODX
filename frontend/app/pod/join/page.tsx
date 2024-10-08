'use client'

import { useState } from 'react'
import { Camera, Mic, Volume2, ChevronDown, AlertCircle, LogIn, CheckCircle2 } from 'lucide-react'

export default function JoinSession() {
    const [name, setName] = useState('folajindayo.base.eth')
    const [isMuted, setIsMuted] = useState(true)
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState(false)
    const [isWaiting, setIsWaiting] = useState(false)

    const handleJoinSession = () => {
        setIsWaiting(true)
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <h1 className="text-3xl font-bold mb-8 text-center">
                    Pod<span className="text-[#7C3AED]">X</span>
                </h1>

                <p className="text-center mb-8 text-lg">
                    You are about to join Base Live Build Session
                </p>


                <div className="flex flex-col md:flex-row gap-6 md:gap-10">
                    <div className="w-full md:w-1/2">
                        <div className="bg-[#1E1E1E] rounded-lg overflow-hidden mb-6">
                            <div className="relative aspect-video">
                                <img
                                    src="/images/woman.png"
                                    alt="Video preview"
                                    className="w-full h-full object-cover"
                                />
                                {isMuted && (
                                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs py-1 px-2 rounded-full flex items-center">
                                        Muted
                                    </div>
                                )}
                                {!isMuted && (
                                    <div className="absolute top-2 left-2 bg-[#7C3AED] text-white text-xs py-1 px-2 rounded-full flex items-center">
                                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></div>
                                        Speaking...
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-center p-2 gap-2">
                                <button className="bg-[#2C2C2C] hover:bg-[#3C3C3C] transition-colors p-2 rounded-md">
                                    <Camera className="w-5 h-5" />
                                </button>
                                <button
                                    className={`${isMuted ? 'bg-red-500' : 'bg-[#2C2C2C]'} hover:bg-[#3C3C3C] transition-colors p-2 rounded-md`}
                                    onClick={() => setIsMuted(!isMuted)}
                                >
                                    <Mic className="w-5 h-5" />
                                </button>
                                <button className="bg-[#2C2C2C] hover:bg-[#3C3C3C] transition-colors p-2 rounded-md">
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {(!isWaiting ?
                        <div className="w-full md:w-1/2 flex flex-col justify-center">
                            <div className="mb-2">
                                <label htmlFor="name" className="block text-[#A3A3A3] mb-2">
                                    What shall we call you?
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                />
                            </div>

                            {isBasenameConfirmed ? (
                                <div className="flex items-center text-green-500 text-sm mb-6">
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    <p>Basename confirmed</p>
                                </div>
                            ) : (
                                <div className="flex items-start text-yellow-600 text-xs mb-6">
                                    <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                                    <p>For better experience, connect your wallet and get a base name</p>
                                </div>
                            )}

                            <button
                                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] transition-colors text-white py-3 rounded-md flex items-center justify-center"
                                onClick={handleJoinSession}
                            >
                                <LogIn className="w-5 h-5 mr-2" />
                                Join session
                            </button>
                        </div>
                        : (
                            <div className="w-full md:w-1/2 flex flex-col justify-center">
                                <h2 className="text-2xl font-semibold mb-2">You are asking to be let in....</h2>
                                <p className="text-[#A3A3A3]">Waiting for the host to accept you in</p>
                            </div>
                        )
                    )}
                </div>

            </div>
        </div>
    )
}