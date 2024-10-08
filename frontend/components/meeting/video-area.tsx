import { DollarSign } from "lucide-react"

interface VideoAreaProps {
    hoveredParticipant: string | null
    currentUser: Participant
    openTipModal: (name: string) => void
}

const VideoArea: React.FC<VideoAreaProps> = ({ hoveredParticipant, currentUser, openTipModal }) => (
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
)


export default VideoArea