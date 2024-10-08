import ParticipantItem from "./participant-item"

interface ParticipantsSidebarProps {
    participants: Participant[]
    currentUser: Participant
    hoveredParticipant: string | null
    setHoveredParticipant: (name: string | null) => void
    openTipModal: (name: string) => void
}

const ParticipantsSidebar: React.FC<ParticipantsSidebarProps> = ({ participants, currentUser, hoveredParticipant, setHoveredParticipant, openTipModal }) => (
    <div className="w-64 bg-[#1E1E1E] p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Participants <span className="bg-[#7C3AED] text-xs px-2 py-0.5 rounded-full ml-2">{participants.length}</span></h2>
        <div className="flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#3C3C3C] scrollbar-track-[#2C2C2C] hover:scrollbar-thumb-[#4C4C4C]">
            {participants.map((participant, index) => (
                <ParticipantItem
                    key={index}
                    participant={participant}
                    currentUser={currentUser}
                    hoveredParticipant={hoveredParticipant}
                    setHoveredParticipant={setHoveredParticipant}
                    openTipModal={openTipModal}
                />
            ))}
        </div>
    </div>
)

export default ParticipantsSidebar