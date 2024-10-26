import { Modal } from "./tips"

interface LeaveConfirmationModalProps {
    setShowLeaveConfirmation: (show: boolean) => void
    confirmLeave: () => void
}

const LeaveConfirmationModal: React.FC<LeaveConfirmationModalProps> = ({ setShowLeaveConfirmation, confirmLeave }) => (
    <Modal>
        <h2 className="text-2xl font-bold mb-4">Are you sure you want to leave this session?</h2>
        <div className="flex justify-end gap-4">
            <button
                className="px-4 py-2 bg-[#2C2C2C] rounded-[10px] hover:bg-[#3C3C3C] transition-colors"
                onClick={() => setShowLeaveConfirmation(false)}
            >
                No, I am staying
            </button>
            <button
                className="px-4 py-2 bg-red-500 text-white rounded-[10px] hover:bg-red-600 transition-colors"
                onClick={confirmLeave}
            >
                Yes, Leave
            </button>
        </div>
    </Modal>
)

export default LeaveConfirmationModal