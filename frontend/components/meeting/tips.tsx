
interface ModalProps {
    children: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ children }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-[#1E1E1E] p-6 rounded-lg w-full max-w-sm">
            {children}
        </div>
    </div>
)

interface TipModalProps {
    selectedTipRecipient: string | null
    tipAmount: string
    setTipAmount: (amount: string) => void
    handleTip: () => void
}

const TipModal: React.FC<TipModalProps> = ({ selectedTipRecipient, tipAmount, setTipAmount, handleTip }) => (
    <Modal>
        <h2 className="text-2xl font-bold mb-4">Tip</h2>
        <p className="mb-4">{selectedTipRecipient}</p>
        <div className="flex mb-4">
            <input
                type="text"
                placeholder="Enter Tip in ETH"
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
        <p className="text-[#A3A3A3]">Balance: 100 ETH</p>
    </Modal>
)

export default TipModal