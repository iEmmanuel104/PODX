'use client'
// @typescript-eslint/no-unused-vars

import { useState } from 'react'
import { Mic, Video, PhoneOff, Settings, ChevronDown, CheckCircle2, XCircle, DollarSign, User, MessageSquare } from 'lucide-react'

type Participant = {
    name: string
    role: 'host' | 'co-host' | 'listener'
    isMuted: boolean
}

export default function MeetingInterface() {
    const [participants, setParticipants] = useState<Participant[]>([
        { name: 'folajindayo.base.eth', role: 'host', isMuted: false },
        { name: 'Jane Doe', role: 'co-host', isMuted: true },
        ...Array(20).fill({ name: 'Listener', role: 'listener', isMuted: true })
    ])
    const [currentUser, setCurrentUser] = useState<Participant>({ name: 'Current User', role: 'listener', isMuted: true })
    const [isMuted, setIsMuted] = useState(true)
    const [isVideoOn, setIsVideoOn] = useState(true)
    const [showTipModal, setShowTipModal] = useState(false)
    const [tipAmount, setTipAmount] = useState('')
    const [showTipSuccess, setShowTipSuccess] = useState(false)
    const [hoveredParticipant, setHoveredParticipant] = useState<string | null>(null)
    const [selectedTipRecipient, setSelectedTipRecipient] = useState<string | null>(null)
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false)
    const [showJoinRequest, setShowJoinRequest] = useState(false)
    const [showSpeakRequest, setShowSpeakRequest] = useState(false)
    const [joinRequestUser, setJoinRequestUser] = useState('')
    const [speakRequestUser, setSpeakRequestUser] = useState('')

    const handleTip = () => {
        setShowTipModal(false)
        setShowTipSuccess(true)
        setTimeout(() => setShowTipSuccess(false), 3000)
    }

    const openTipModal = (participantName: string) => {
        setSelectedTipRecipient(participantName)
        setShowTipModal(true)
    }

    const handleLeave = () => {
        setShowLeaveConfirmation(true)
    }

    const confirmLeave = () => {
        // Handle leaving the session
        setShowLeaveConfirmation(false)
    }

    const handleJoinRequest = () => {
        setJoinRequestUser('folajindayo.base.eth')
        setShowJoinRequest(true)
    }

    const handleSpeakRequest = () => {
        setSpeakRequestUser('folajindayo.base.eth')
        setShowSpeakRequest(true)
    }

    return (
        <div className="h-screen bg-[#121212] text-white flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center p-4 h-16">
                <div className="flex items-center">
                    <h1 className="text-xl font-bold mr-4">
                        Pod<span className="text-[#7C3AED]">X</span>
                    </h1>
                    <span className="text-sm mr-2">Base Live Build Session</span>
                    <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">Live</span>
                </div>
                <button className="text-[#A3A3A3] hover:text-white transition-colors">
                    <Settings className="w-6 h-6" />
                </button>
            </header>

            {/* Main content */}
            <div className="flex-grow flex overflow-hidden">
                {/* Video area */}
                <div className="flex-grow p-4">
                    <div className="h-full relative bg-[#2C2C2C] rounded-lg overflow-hidden">
                        <img
                            src="/images/woman.png"
                            alt="Current speaker"
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 bg-[#7C3AED] text-white text-xs py-1 px-2 rounded-full">
                            Muted
                        </div>
                        {hoveredParticipant === 'folajindayo.base.eth' && currentUser.role === 'listener' && (
                            <button
                                className="absolute bottom-4 right-4 bg-[#2C2C2C] text-white text-sm py-2 px-4 rounded-full flex items-center"
                                onClick={() => openTipModal('folajindayo.base.eth')}
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Tip
                            </button>
                        )}
                    </div>
                </div>

                {/* Participants sidebar */}
                <div className="w-64 bg-[#1E1E1E] p-4 flex flex-col">
                    <h2 className="text-lg font-semibold mb-4">Participants <span className="bg-[#7C3AED] text-xs px-2 py-0.5 rounded-full ml-2">19</span></h2>
                    <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3C3C3C] scrollbar-track-[#2C2C2C] hover:scrollbar-thumb-[#4C4C4C]">
                        {participants.map((participant, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between relative mb-2"
                                onMouseEnter={() => setHoveredParticipant(participant.name)}
                                onMouseLeave={() => setHoveredParticipant(null)}
                            >
                                <div>
                                    <span className="text-sm">{participant.name}</span>
                                    {participant.role === 'host' && <span className="text-xs text-[#A3A3A3] ml-1">(Host)</span>}
                                    {participant.role === 'co-host' && <span className="text-xs text-[#A3A3A3] ml-1">(Co-host)</span>}
                                    <br />
                                    <span className="text-xs text-[#A3A3A3]">{participant.role === 'listener' ? 'Listener' : 'Speaker'}</span>
                                </div>
                                <div className="flex items-center">
                                    <div className={`w-2 h-2 rounded-full ${participant.isMuted ? 'bg-red-500' : 'bg-green-500'} mr-2`}></div>
                                    <ChevronDown className="w-4 h-4 text-[#A3A3A3]" />
                                </div>
                                {hoveredParticipant === participant.name &&
                                    currentUser.role === 'listener' &&
                                    (participant.role === 'host' || participant.role === 'co-host') && (
                                        <button
                                            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-[#2C2C2C] text-white text-xs py-1 px-2 rounded-full"
                                            onClick={() => openTipModal(participant.name)}
                                        >
                                            Tip
                                        </button>
                                    )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer controls */}
            <footer className="bg-[#1E1E1E] p-4 flex justify-center items-center gap-4 h-20">
                <button
                    className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-[#2C2C2C]'} hover:bg-opacity-80 transition-colors`}
                    onClick={() => setIsMuted(!isMuted)}
                >
                    <Mic className="w-6 h-6" />
                </button>
                <button
                    className={`p-3 rounded-full ${isVideoOn ? 'bg-[#2C2C2C]' : 'bg-red-500'} hover:bg-opacity-80 transition-colors`}
                    onClick={() => setIsVideoOn(!isVideoOn)}
                >
                    <Video className="w-6 h-6" />
                </button>
                <button
                    className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center hover:bg-opacity-80 transition-colors"
                    onClick={handleLeave}
                >
                    <PhoneOff className="w-5 h-5 mr-2" />
                    Leave
                </button>
            </footer>

            {/* Tip Modal */}
            {showTipModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-[#1E1E1E] p-6 rounded-lg w-full max-w-sm">
                        <h2 className="text-2xl font-bold mb-4">Tip</h2>
                        <p className="mb-4">{selectedTipRecipient}</p>
                        <div className="flex mb-4">
                            <input
                                type="text"
                                placeholder="Enter Tip in USDC"
                                value={tipAmount}
                                onChange={(e) => setTipAmount(e.target.value)}
                                className="flex-1 bg-[#2C2C2C] rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                            />
                            <button
                                onClick={handleTip}
                                className="bg-[#7C3AED] text-white px-4 py-2 rounded-r-md hover:bg-[#6D28D9] transition-colors"
                            >
                                Tip
                            </button>
                        </div>
                        <p className="text-[#A3A3A3]">Balance: 100 USDC</p>
                    </div>
                </div>
            )}

            {/* Leave Confirmation Modal */}
            {showLeaveConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-[#1E1E1E] p-6 rounded-lg w-full max-w-sm">
                        <h2 className="text-2xl font-bold mb-4">Are you sure you want to leave this session?</h2>
                        <div className="flex justify-end gap-4">
                            <button
                                className="px-4 py-2 bg-[#2C2C2C] rounded-md hover:bg-[#3C3C3C] transition-colors"
                                onClick={() => setShowLeaveConfirmation(false)}
                            >
                                No, I am staying
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                onClick={confirmLeave}
                            >
                                Yes, Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join Request Notification */}
            {showJoinRequest && (
                <div className="fixed bottom-4 right-4 bg-[#2C2C2C] text-white p-4 rounded-lg flex items-center gap-4">
                    <User className="w-10 h-10" />
                    <div>
                        <p className="font-semibold">{joinRequestUser} wants to join your session</p>
                    </div>
                    <button
                        className="bg-green-500 p-2 rounded-full hover:bg-green-600 transition-colors"
                        onClick={() => setShowJoinRequest(false)}
                    >
                        <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <button
                        className="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                        onClick={() => setShowJoinRequest(false)}
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Speak Request Notification */}
            {showSpeakRequest && (
                <div className="fixed bottom-4 right-4 bg-[#2C2C2C] text-white p-4 rounded-lg flex items-center gap-4">
                    <MessageSquare className="w-10 h-10" />
                    <div>
                        <p className="font-semibold">{speakRequestUser} wants to speak</p>
                    </div>
                    <button
                        className="bg-green-500 p-2 rounded-full hover:bg-green-600 transition-colors"
                        onClick={() => setShowSpeakRequest(false)}
                    >
                        <CheckCircle2 className="w-6 h-6" />
                    </button>
                    <button
                        className="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors"
                        onClick={() => setShowSpeakRequest(false)}
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Tip Success Notification */}
            {showTipSuccess && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    You successfully tipped {selectedTipRecipient} {tipAmount} USDC
                </div>
            )}
        </div>
    )
}