import React from "react";
import { Modal } from "./tips";

interface ThankYouModalProps {
    onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ onClose }) => (
    <Modal>
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Thank You for Joining!</h2>
            <p className="mb-6">We hope you enjoyed the session. See you next time!</p>
            <button className="px-6 py-2 bg-[#6032F6] text-white rounded-md hover:bg-[#4C28C4] transition-colors" onClick={onClose}>
                Close
            </button>
        </div>
    </Modal>
);

export default ThankYouModal;
