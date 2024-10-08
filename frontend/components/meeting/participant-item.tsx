import { ChevronDown } from "lucide-react"

interface ParticipantItemProps {
    participant: Participant
    currentUser: Participant
    hoveredParticipant: string | null
    setHoveredParticipant: (name: string | null) => void
    openTipModal: (name: string) => void
}

const ParticipantItem: React.FC<ParticipantItemProps> = ({ participant, currentUser, hoveredParticipant, setHoveredParticipant, openTipModal }) => (
    <div
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
)

export default ParticipantItem