'use client'

import { useState } from 'react'
import { Settings, Mic, X, ChevronDown, Link, Copy, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PodXInterface() {
    const router = useRouter()
    
    const [meetingCode, setMeetingCode] = useState('')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isCreatedModalOpen, setIsCreatedModalOpen] = useState(false)
    const [sessionTitle, setSessionTitle] = useState('Session-1')
    const [sessionType, setSessionType] = useState('Audio Session')
    const [inviteLink, setInviteLink] = useState('https://podx.studio/studio/temidayo-folajins-hv...')
    const [sessionCode, setSessionCode] = useState('XA4-56Y')

    const openCreateModal = () => setIsCreateModalOpen(true)
    const closeCreateModal = () => setIsCreateModalOpen(false)
    const openCreatedModal = () => setIsCreatedModalOpen(true)
    const closeCreatedModal = () => setIsCreatedModalOpen(false)

    const handleCreateSession = () => {
        closeCreateModal()
        openCreatedModal()
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-2xl flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-12">
                    Pod<span className="text-[#7C3AED]">X</span>
                </h1>

                <div className="flex items-center mb-16">
                    <div className="w-8 h-8 bg-[#7C3AED] rounded-full flex items-center justify-center text-xs font-bold mr-2">
                        FB
                    </div>
                    <span className="text-[#A3A3A3]">folajinidayo.basu.eth</span>
                </div>

                <div className="w-full flex flex-col md:flex-row gap-6 mb-16">
                    <div className="flex-1 rounded-lg p-6 bg-gradient-to-br from-[#2C2C2C] to-[#1A1A1A]">
                        <h2 className="text-2xl font-semibold mb-2 text-white">Join Session</h2>
                        <p className="text-[#A3A3A3] mb-4">Join a meeting instantly and collaborate!</p>
                        <div className="flex">
                            <input
                                type="text"
                                placeholder="Enter meeting code"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                className="flex-1 bg-[#3C3C3C] rounded-l-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] text-white placeholder-[#6C6C6C]"
                            />
                            <button onClick={() => router.push("/podcast/join")} className="bg-gradient-to-br from-[#9F7AEA] to-[#5B21B6] text-white px-4 py-2 rounded-r-md hover:from-[#8B5CF6] hover:to-[#4C1D95] transition-all duration-300 ease-in-out">
                                Join
                            </button>
                        </div>
                    </div>

                    <div
                        className="flex-1 rounded-lg p-6 cursor-pointer transition-all duration-300 ease-in-out bg-gradient-to-br from-[#9F7AEA] to-[#5B21B6] hover:from-[#8B5CF6] hover:to-[#4C1D95]"
                        onClick={openCreateModal}
                    >
                        <Mic className="w-12 h-12 mb-4 text-white" />
                        <h2 className="text-2xl font-semibold mb-2 text-white">Create Session</h2>
                        <p className="text-[#E9D5FF]">
                            Start a meeting or podcast session in seconds - collaborate, share, and record with ease!
                        </p>
                    </div>
                </div>
            </div>

            <button className="text-[#A3A3A3] hover:text-white transition-colors flex items-center gap-4">
                <Settings className="w-6 h-6" /> Settings
            </button>

            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Create session</h2>
                            <button onClick={closeCreateModal} className="text-[#A3A3A3] hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label htmlFor="sessionTitle" className="block text-[#A3A3A3] mb-2">Session title</label>
                            <input
                                id="sessionTitle"
                                type="text"
                                value={sessionTitle}
                                onChange={(e) => setSessionTitle(e.target.value)}
                                className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                            />
                        </div>
                        <div className="mb-6">
                            <label htmlFor="sessionType" className="block text-[#A3A3A3] mb-2">Session type</label>
                            <div className="relative">
                                <select
                                    id="sessionType"
                                    value={sessionType}
                                    onChange={(e) => setSessionType(e.target.value)}
                                    className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                                >
                                    <option>Audio Session</option>
                                    <option>Video Session</option>
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#A3A3A3]" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button
                                onClick={closeCreateModal}
                                className="px-4 py-2 bg-[#2C2C2C] rounded-md hover:bg-[#3C3C3C] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSession}
                                className="px-4 py-2 bg-[#7C3AED] rounded-md hover:bg-[#6D28D9] transition-colors"
                            >
                                Create session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreatedModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-[#1E1E1E] rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-semibold">Your session is created</h2>
                            <button onClick={closeCreatedModal} className="text-[#A3A3A3] hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="mb-4">
                            <label className="text-[#A3A3A3] mb-2 flex items-center">
                                <Link className="w-4 h-4 mr-2" />
                                Share invite link
                            </label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={inviteLink}
                                    readOnly
                                    className="flex-1 bg-[#2C2C2C] rounded-l-md px-4 py-2 focus:outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(inviteLink)}
                                    className="bg-[#7C3AED] text-white px-4 py-2 rounded-r-md hover:bg-[#6D28D9] transition-colors"
                                >
                                    Copy Link
                                </button>
                            </div>
                        </div>
                        <div className="mb-2 text-center text-[#A3A3A3]">OR</div>
                        <div className="mb-4">
                            <label className="block text-[#A3A3A3] mb-2">Session code</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={sessionCode}
                                    readOnly
                                    className="flex-1 bg-[#2C2C2C] rounded-l-md px-4 py-2 focus:outline-none"
                                />
                                <button
                                    onClick={() => copyToClipboard(sessionCode)}
                                    className="bg-[#7C3AED] text-white px-4 py-2 rounded-r-md hover:bg-[#6D28D9] transition-colors"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                        <div className="flex items-start text-[#A3A3A3] text-sm">
                            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                            <p>For the best experience, remind participants to connect their wallet when joining through the session link</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}