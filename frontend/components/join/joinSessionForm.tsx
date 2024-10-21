import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, LogIn } from "lucide-react";

const JoinSessionForm: React.FC = () => {
    const [name, setName] = useState("");
    const [isBasenameConfirmed, setIsBasenameConfirmed] = useState(false);

    const handleJoinSession = () => {
        // Implement join session logic here
    };

    return (
        <div className="w-full max-w-md">
            <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-400 mb-2">
                    What shall we call you?
                </label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full" />
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

            <Button className="w-full" onClick={handleJoinSession}>
                <LogIn className="w-5 h-5 mr-2" />
                Join session
            </Button>
        </div>
    );
};

export default JoinSessionForm;
