import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { User, MessageSquare, CheckCircle2, XCircle } from "lucide-react";

interface NotificationProps {
    type: "join" | "speak";
    user: string;
    onAccept: () => void;
    onReject: () => void;
}

const Notification: React.FC<NotificationProps> = ({ type, user, onAccept, onReject }) => {
    return (
        <Alert className="fixed bottom-4 right-4 w-80">
            <AlertTitle className="flex items-center">
                {type === "join" ? <User className="w-4 h-4 mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                {type === "join" ? "Join Request" : "Speak Request"}
            </AlertTitle>
            <AlertDescription>
                <p className="mb-2">
                    {user} wants to {type === "join" ? "join your session" : "speak"}.
                </p>
                <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={onReject}>
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                    <Button size="sm" onClick={onAccept}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Accept
                    </Button>
                </div>
            </AlertDescription>
        </Alert>
    );
};

interface NotificationsProps {
    joinRequests: string[];
    speakRequests: string[];
    onAcceptJoin: (user: string) => void;
    onRejectJoin: (user: string) => void;
    onAcceptSpeak: (user: string) => void;
    onRejectSpeak: (user: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ joinRequests, speakRequests, onAcceptJoin, onRejectJoin, onAcceptSpeak, onRejectSpeak }) => {
    return (
        <>
            {joinRequests.map((user) => (
                <Notification key={`join-${user}`} type="join" user={user} onAccept={() => onAcceptJoin(user)} onReject={() => onRejectJoin(user)} />
            ))}
            {speakRequests.map((user) => (
                <Notification
                    key={`speak-${user}`}
                    type="speak"
                    user={user}
                    onAccept={() => onAcceptSpeak(user)}
                    onReject={() => onRejectSpeak(user)}
                />
            ))}
        </>
    );
};

export default Notifications;
