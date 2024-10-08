import { AlertCircle, CheckCircle2, LogIn } from "lucide-react";

interface UserInputFormProps {
    name: string;
    setName: React.Dispatch<React.SetStateAction<string>>;
    isBasenameConfirmed: boolean;
    handleJoinSession: () => void;
}

const UserInputForm: React.FC<UserInputFormProps> = ({ name, setName, isBasenameConfirmed, handleJoinSession }) => (
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
                className="w-full bg-[#2C2C2C] rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6032F6]"
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
            className="w-full rounded-full bg-[#6032F6] hover:bg-[#6a41f0] transition-colors text-white py-3 flex items-center justify-center"
            onClick={handleJoinSession}
        >
            <LogIn className="w-5 h-5 mr-2" />
            Join session
        </button>
    </div>
)

export default UserInputForm