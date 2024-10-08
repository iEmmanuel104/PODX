import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Mic, Link } from "lucide-react";
import CreateSessionModal from "./createSessionModal";

const PodInterface: React.FC = () => {
    const [meetingCode, setMeetingCode] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold mb-12">
                Pod<span className="text-purple-500">X</span>
            </h1>

            <div className="w-full max-w-2xl flex flex-col md:flex-row gap-6 mb-16">
                <Card className="flex-1 bg-gray-800">
                    <CardHeader>
                        <h2 className="text-2xl font-semibold">Join Session</h2>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-400 mb-4">Join a meeting instantly and collaborate!</p>
                        <div className="flex">
                            <Input
                                type="text"
                                placeholder="Enter meeting code"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                className="flex-1 mr-2"
                            />
                            <Button>Join</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className="flex-1 bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <CardHeader>
                        <Mic className="w-12 h-12 mb-4" />
                        <h2 className="text-2xl font-semibold">Create Session</h2>
                    </CardHeader>
                    <CardContent>
                        <p>Start a meeting or podcast session in seconds - collaborate, share, and record with ease!</p>
                    </CardContent>
                </Card>
            </div>

            <CreateSessionModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />
        </div>
    );
};

export default PodInterface;
