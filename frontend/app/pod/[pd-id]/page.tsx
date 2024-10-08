'use client'

import React, { useState } from 'react'
import { Mic, Video, PhoneOff, Settings, ChevronDown, CheckCircle2, XCircle, DollarSign, User, MessageSquare } from 'lucide-react'
import TipModal, { Modal } from '@/components/meeting/tips'
import Header from '@/components/meeting/header'
import VideoArea from '@/components/meeting/video-area'
import ParticipantsSidebar from '@/components/meeting/participantList'
import FooterControls from '@/components/meeting/footer'
import LeaveConfirmationModal from '@/components/meeting/leave-confirm'
import Notifications from '@/components/meeting/notifications'











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
    const [joinRequests, setJoinRequests] = useState<string[]>([])
    const [speakRequests, setSpeakRequests] = useState<string[]>([])

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
        setJoinRequests(prev => [...prev, 'folajindayo.base.eth'])
    }

    const handleSpeakRequest = () => {
        setSpeakRequests(prev => [...prev, 'folajindayo.base.eth'])
    }

    const onAcceptJoin = (user: string) => {
        // Logic to accept join request
        setJoinRequests(prev => prev.filter(u => u !== user))
        // Add user to participants list
        setParticipants(prev => [...prev, { name: user, role: 'listener', isMuted: true }])
    }

    const onRejectJoin = (user: string) => {
        // Logic to reject join request
        setJoinRequests(prev => prev.filter(u => u !== user))
    }

    const onAcceptSpeak = (user: string) => {
        // Logic to accept speak request
        setSpeakRequests(prev => prev.filter(u => u !== user))
        // Change user's role to speaker
        setParticipants(prev => prev.map(p => p.name === user ? { ...p, role: 'co-host' } : p))
    }

    const onRejectSpeak = (user: string) => {
        // Logic to reject speak request
        setSpeakRequests(prev => prev.filter(u => u !== user))
    }

    return (
        <div className="h-screen bg-[#121212] text-white flex flex-col">
            <Header />
            <div className="flex-grow flex overflow-hidden">
                <VideoArea
                    hoveredParticipant={hoveredParticipant}
                    currentUser={currentUser}
                    openTipModal={openTipModal}
                />
                <ParticipantsSidebar
                    participants={participants}
                    currentUser={currentUser}
                    hoveredParticipant={hoveredParticipant}
                    setHoveredParticipant={setHoveredParticipant}
                    openTipModal={openTipModal}
                />
            </div>
            <FooterControls
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                isVideoOn={isVideoOn}
                setIsVideoOn={setIsVideoOn}
                handleLeave={handleLeave}
            />

            {showTipModal && (
                <TipModal
                    selectedTipRecipient={selectedTipRecipient}
                    tipAmount={tipAmount}
                    setTipAmount={setTipAmount}
                    handleTip={handleTip}
                />
            )}

            {showLeaveConfirmation && (
                <LeaveConfirmationModal
                    setShowLeaveConfirmation={setShowLeaveConfirmation}
                    confirmLeave={confirmLeave}
                />
            )}

            <Notifications
                joinRequests={joinRequests}
                speakRequests={speakRequests}
                onAcceptJoin={onAcceptJoin}
                onRejectJoin={onRejectJoin}
                onAcceptSpeak={onAcceptSpeak}
                onRejectSpeak={onRejectSpeak}
            />

            {showTipSuccess && (
                <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    You successfully tipped {selectedTipRecipient} {tipAmount} USDC
                </div>
            )}
        </div>
    )
}