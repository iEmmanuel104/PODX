import { Mic, PhoneOff, Video } from "lucide-react"

interface FooterControlsProps {
    isMuted: boolean
    setIsMuted: (muted: boolean) => void
    isVideoOn: boolean
    setIsVideoOn: (on: boolean) => void
    handleLeave: () => void
}

const FooterControls: React.FC<FooterControlsProps> = ({ isMuted, setIsMuted, isVideoOn, setIsVideoOn, handleLeave }) => (
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
)

export default FooterControls