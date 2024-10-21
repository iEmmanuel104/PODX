import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { User, MessageSquare, CheckCircle2, XCircle, Phone, PhoneOff, Loader, WifiOff } from "lucide-react";
import { CallingState } from "@stream-io/video-react-sdk";

interface NotificationProps {
    type: "join" | "speak" | "callState";
    user?: string;
    onAccept?: () => void;
    onReject?: () => void;
    callState?: CallingState;
}

const Notification: React.FC<NotificationProps> = ({ type, user, onAccept, onReject, callState }) => {
    if (type === "callState") {
        let title = "";
        let description = "";
        let icon = null;

        switch (callState) {
            case CallingState.RINGING:
                title = "Incoming Call";
                description = "Someone is trying to join the call.";
                icon = <Phone className="w-4 h-4 mr-2 text-white" />;
                break;
            case CallingState.JOINING:
                title = "Joining Call";
                description = "Please wait while we connect you to the call.";
                icon = <Loader className="w-4 h-4 mr-2 animate-spin text-white" />;
                break;
            case CallingState.LEFT:
                title = "Call Ended";
                description = "You have left the call. Have a nice day!";
                icon = <PhoneOff className="w-4 h-4 mr-2 text-white" />;
                break;
            case CallingState.RECONNECTING:
            case CallingState.MIGRATING:
                title = "Reconnecting";
                description = "We're trying to restore your connection. Please wait.";
                icon = <Loader className="w-4 h-4 mr-2 animate-spin text-white" />;
                break;
            case CallingState.RECONNECTING_FAILED:
            case CallingState.OFFLINE:
                title = "Connection Lost";
                description = "We couldn't reconnect you to the call. Please check your internet connection.";
                icon = <WifiOff className="w-4 h-4 mr-2 text-white" />;
                break;
            default:
                return null;
        }

        return (
            <Alert className="fixed bottom-4 right-4 w-80 bg-[#121212] border-[#6032f6] text-white">
                <AlertTitle className="flex items-center text-white">
                    {icon}
                    {title}
                </AlertTitle>
                <AlertDescription className="text-white">{description}</AlertDescription>
            </Alert>
        );
    }

    return (
        <Alert className="fixed bottom-4 right-4 w-80 bg-[#121212] border-[#6032f6] text-white">
            <AlertTitle className="flex items-center text-white">
                {type === "join" ? <User className="w-4 h-4 mr-2 text-white" /> : <MessageSquare className="w-4 h-4 mr-2 text-white" />}
                {type === "join" ? "Join Request" : "Speak Request"}
            </AlertTitle>
            <AlertDescription className="text-white">
                <p className="mb-2">
                    {user} wants to {type === "join" ? "join your session" : "speak"}.
                </p>
                <div className="flex justify-end space-x-2">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onReject}
                        className="border-[#6032f6] text-white hover:bg-[#6032f6] hover:text-white transition-colors"
                    >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                    </Button>
                    <Button size="sm" onClick={onAccept} className="bg-[#6032f6] text-white hover:bg-[#4a27c4] transition-colors">
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
    callingState: CallingState;
}

const Notifications: React.FC<NotificationsProps> = ({
    joinRequests,
    speakRequests,
    onAcceptJoin,
    onRejectJoin,
    onAcceptSpeak,
    onRejectSpeak,
    callingState,
}) => {
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
            <Notification type="callState" callState={callingState} />
        </>
    );
};

export default Notifications;
