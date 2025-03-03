import React, { useState, useMemo, memo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Link, Copy, Check, Share2, Search, X, Trash2, AlertTriangle } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StreamCallData } from './streamCallData';
import { useScheduledCalls } from '@/hooks/useScheduledCalls';
import toast from 'react-hot-toast';

interface ScheduledPodsProps {
    sessions: StreamCallData[];
    onJoinSession: (session: StreamCallData) => void;
    currentUserId: string;
    isLoading?: boolean;
    foundSession?: StreamCallData;
    onClearFoundSession?: () => void;
}

// Types for internal state
interface ShareSessionState {
    isOpen: boolean;
    sessionId: string;
    sessionTitle: string;
    startTime: Date;
}

// Utility functions
const canJoinSession = (startsAt: string) => {
    const startTime = new Date(startsAt);
    const now = new Date();
    const minutesUntilStart = differenceInMinutes(startTime, now);
    return minutesUntilStart <= 5 && minutesUntilStart >= -60;
};

const getSessionStatus = (startsAt: string) => {
    const startTime = new Date(startsAt);
    const now = new Date();
    const minutesUntilStart = differenceInMinutes(startTime, now);

    if (minutesUntilStart > 5) {
        return {
            text: `Starts in ${Math.floor(minutesUntilStart / 60)}h ${minutesUntilStart % 60}m`,
            color: 'text-[#DDB958]',
        };
    } else if (minutesUntilStart > -60) {
        return {
            text: minutesUntilStart > 0 ? 'Starting soon' : 'In progress',
            color: 'text-green-500',
        };
    } else {
        return {
            text: 'Ended',
            color: 'text-red-500',
        };
    }
};

// Memoized components
const ShareDialog = memo(function ShareDialog({
    isOpen,
    onClose,
    sessionId,
    sessionTitle,
    startTime,
}: {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    sessionTitle: string;
    startTime: Date;
}) {
    const [linkCopied, setLinkCopied] = useState(false);
    const [codeCopied, setCodeCopied] = useState(false);
    const inviteLink = `https://www.podx.fun/pod/join/${sessionId}`;

    const copyToClipboard = async (text: string, isLink: boolean) => {
        try {
            await navigator.clipboard.writeText(text);
            const setter = isLink ? setLinkCopied : setCodeCopied;
            setter(true);
            setTimeout(() => setter(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} modal>
            <DialogContent className="bg-[#1E1E1E] text-white rounded-[10px] p-6 w-full max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-4">Share Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {/* Share link section */}
                    <div>
                        <label className="text-[#A3A3A3] mb-2 flex items-center text-sm">
                            <Link className="w-4 h-4 mr-2" />
                            Invite link
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={inviteLink}
                                readOnly
                                className="flex-1 bg-[#2C2C2C] text-sm border-[#3c3c3c]"
                            />
                            <Button
                                onClick={() => copyToClipboard(inviteLink, true)}
                                className="bg-[#6032F6] hover:bg-[#4C28C4]"
                                size="icon"
                            >
                                {linkCopied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Meeting code section */}
                    <div>
                        <label className="text-[#A3A3A3] mb-2 flex items-center text-sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            Meeting code
                        </label>
                        <div className="flex gap-2">
                            <Input
                                value={sessionId}
                                readOnly
                                className="flex-1 bg-[#2C2C2C] text-sm border-[#3c3c3c]"
                            />
                            <Button
                                onClick={() => copyToClipboard(sessionId, false)}
                                className="bg-[#6032F6] hover:bg-[#4C28C4]"
                                size="icon"
                            >
                                {codeCopied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Session details */}
                    <div className="pt-2 text-sm text-[#A3A3A3]">
                        <p>Session Details:</p>
                        <p>Title: {sessionTitle}</p>
                        <p>Start time: {format(startTime, "PPP 'at' p")}</p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
});

// Delete Confirmation Dialog Component
const DeleteConfirmationDialog = memo(function DeleteConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    sessionTitle,
    isDeleting,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<boolean>;
    sessionTitle: string;
    isDeleting: boolean;
}) {
    const [deleteSuccess, setDeleteSuccess] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        // Reset states when dialog opens or closes
        if (!isOpen) {
            setDeleteSuccess(false);
            setDeleteError(null);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        try {
            setDeleteError(null);
            const success = await onConfirm();

            if (success) {
                setDeleteSuccess(true);
                toast.success('Session deleted successfully');
                // Auto close after showing success
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setDeleteError('Failed to delete session. Please try again.');
            }
        } catch (error) {
            console.error('Error in delete confirmation:', error);
            // Check if this is a 404 error, which we should handle as success
            // since it means the session is already gone
            if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
                setDeleteSuccess(true);
                toast.success('Session deleted successfully');
                setTimeout(() => {
                    onClose();
                }, 1500);
                return;
            }
            setDeleteError('An unexpected error occurred. Please try again.');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => !isDeleting && !open && onClose()}>
            <DialogContent className="bg-black border-[#2C2C2C] max-w-md animate-in zoom-in-95 duration-200">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        {deleteSuccess ? (
                            <div className="bg-green-500/20 p-1.5 rounded-full">
                                <Check className="h-5 w-5 text-green-500" />
                            </div>
                        ) : (
                            <div className="bg-red-500/20 p-1.5 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                        )}
                        <span>{deleteSuccess ? 'Session Deleted' : 'Delete Session'}</span>
                    </DialogTitle>
                    <DialogDescription className="text-[#A3A3A3] pt-2">
                        {deleteSuccess ? (
                            <span>Your session has been successfully deleted.</span>
                        ) : deleteError ? (
                            <span className="text-red-400">{deleteError}</span>
                        ) : (
                            <span>Are you sure you want to delete the session <span className="text-white font-semibold">"{sessionTitle}"</span>? This action cannot be undone.</span>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-3 pt-6 sm:justify-between">
                    {deleteSuccess ? (
                        <Button
                            variant="default"
                            onClick={onClose}
                            className="flex-1 bg-[#6032F6] hover:bg-[#4C28C4] text-white transition-colors"
                        >
                            Done
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 bg-transparent text-white border-[#3C3C3C] hover:bg-[#2C2C2C] hover:text-white transition-colors"
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirm}
                                className="flex-1 bg-red-600 text-white hover:bg-red-700 transition-colors"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                                        Deleting...
                                    </span>
                                ) : deleteError ? (
                                    'Try Again'
                                ) : (
                                    'Delete Session'
                                )}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});

DeleteConfirmationDialog.displayName = 'DeleteConfirmationDialog';

// SessionCard component
const SessionCard = memo(function SessionCard({
    session,
    currentUserId,
    onJoinSession,
    onShareSession,
    showFoundBadge = false,
    onClose,
    onRefresh,
}: {
    session: StreamCallData;
    currentUserId: string;
    onJoinSession: (session: StreamCallData) => void;
    onShareSession: (data: ShareSessionState) => void;
    showFoundBadge?: boolean;
    onClose?: () => void;
    onRefresh?: () => void;
}) {
    const isCreator = session.created_by.id === currentUserId;
    const startsAt = session.starts_at ? new Date(session.starts_at) : null;
    const status = startsAt ? getSessionStatus(session.starts_at) : null;
    const canJoin = startsAt ? canJoinSession(session.starts_at) : false;
    const { deleteScheduledCall } = useScheduledCalls();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleJoinClick = () => {
        // Validate join conditions here
        if (!canJoin) {
            return; // Button will be disabled
        }

        if (!isCreator && status?.text !== 'In progress') {
            return; // Button will be disabled
        }

        setIsJoining(true); // Set loading to true when joining
        
        try {
            // Call the join session function
            onJoinSession(session);
            
            // Set a timeout to reset the loading state
            // This gives a better UX by showing the spinner for at least a short time
            setTimeout(() => {
                setIsJoining(false);
            }, 1500); // Reset after 1.5 seconds
        } catch (error) {
            console.error('Error joining session:', error);
            setIsJoining(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            
            // Call the delete function and get the result
            const deleteSuccessful = await deleteScheduledCall(session.id);
            console.log('Delete operation result:', deleteSuccessful);
            
            if (deleteSuccessful) {
                // If delete was successful, trigger a refresh if available
                if (onRefresh) {
                    onRefresh();
                }
                return true;
            } else {
                // If delete failed but didn't throw an error, still return false
                console.error('Session deletion failed without throwing an error');
                return false;
            }
        } catch (error) {
            console.error('Error deleting session:', error);
            return false;
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="relative">
            {showFoundBadge && (
                <div className="absolute -top-6 left-0 right-0 flex justify-between items-center">
                    <div className="text-[#A3A3A3] flex items-center text-xl font-semibold">
                        <Search className="w-4 h-4 mr-2" />
                        Found Session
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-[#A3A3A3] hover:text-white p-1 h-auto"
                            onClick={onClose}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            )}
            <div className="flex items-center justify-between w-full bg-[#1E1E1E] rounded-[10px] p-4 hover:bg-[#2C2C2C] transition-colors">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#2C2C2C] flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[#6032F6]" />
                    </div>
                    <div className="min-w-0 overflow-hidden">
                        <h3 className="text-white font-medium truncate">{session.custom.title}</h3>
                        <p className="text-sm text-[#A3A3A3] truncate">
                            {startsAt ? format(startsAt, "PPP 'at' p") : 'Time not set'}
                        </p>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-[#A3A3A3]">
                                Hosted by:{' '}
                                {session.created_by.custom?.username || session.created_by.name}
                            </p>
                            {status && (
                                <span className={`text-xs ${status.color}`}>• {status.text}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {isCreator && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-[#6032F6] hover:text-[#4C28C4] hover:bg-[#2C2C2C]"
                                onClick={() =>
                                    onShareSession({
                                        isOpen: true,
                                        sessionId: session.id,
                                        sessionTitle: session.custom.title,
                                        startTime: new Date(session.starts_at),
                                    })
                                }
                                title="Share session"
                            >
                                <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-[#2C2C2C]"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isDeleting}
                                title="Delete session"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>

                            {/* Delete Confirmation Dialog */}
                            <DeleteConfirmationDialog
                                isOpen={showDeleteConfirm}
                                onClose={() => setShowDeleteConfirm(false)}
                                onConfirm={handleDelete}
                                sessionTitle={session.custom.title}
                                isDeleting={isDeleting}
                            />
                        </>
                    )}
                    <Button
                        variant="default"
                        size="sm"
                        className={`bg-[#6032F6] hover:bg-[#4C28C4] text-white text-xs px-3 py-1.5 h-auto`}
                        onClick={handleJoinClick}
                        disabled={isJoining || !canJoin || (!isCreator && status?.text !== 'In progress')}
                        title={getButtonTitle(isCreator, canJoin, status?.text)}
                    >
                        {isJoining ? (
                            <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                Joining...
                            </>
                        ) : (
                            getButtonText(isCreator, canJoin, status?.text)
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
});

// Main component
export default function ScheduledPods({
    sessions,
    foundSession,
    onJoinSession,
    currentUserId,
    isLoading: isLoadingProp,
    onClearFoundSession,
}: ScheduledPodsProps) {
    const [showAllSessions, setShowAllSessions] = useState(false);
    const [shareSession, setShareSession] = useState<ShareSessionState | null>(null);
    const [dialogKey, setDialogKey] = useState(0);
    const { refreshSessions, refetchSessions } = useScheduledCalls();
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    // Function to force refresh sessions data
    const handleRefresh = useCallback(async () => {
        console.log('Manually refreshing sessions list...');
        setLastRefresh(new Date());
        await refreshSessions();
    }, [refreshSessions]);

    // Set up auto-refresh on component mount/unmount and visibility changes
    useEffect(() => {
        console.log('Setting up session refresh behaviors');

        // Refresh when the component mounts
        handleRefresh();

        // Set up visibility change listener to refresh when tab becomes active
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log('Tab became visible, refreshing sessions');
                refetchSessions();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Refresh every minute
        const intervalId = setInterval(() => {
            refetchSessions();
        }, 60000);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(intervalId);
        };
    }, [handleRefresh, refetchSessions]);

    // Function to force open the dialog
    const openViewAllDialog = useCallback(() => {
        console.log('Opening view all dialog');
        // Refresh sessions data before showing all sessions
        refreshSessions().then(() => {
            setShowAllSessions(true);
            setDialogKey(prev => prev + 1);
        });
    }, [refreshSessions]);

    // Memoize session calculations
    const { upcomingSessions } = useMemo(() => {
        // Filter to include sessions that:
        // 1. Were created by the current user, OR
        // 2. The current user is whitelisted to join
        const userSessions = sessions.filter(session =>
            session.created_by.id === currentUserId ||
            (session.custom?.whitelistedUsers &&
             session.custom.whitelistedUsers.includes(currentUserId))
        );

        const sorted = [...userSessions].sort((a, b) => {
            const dateA = a.starts_at ? new Date(a.starts_at).getTime() : 0;
            const dateB = b.starts_at ? new Date(b.starts_at).getTime() : 0;
            return dateA - dateB;
        });

        // Show sessions scheduled for the future and those that ended less than 60 minutes ago
        const upcoming = sorted.filter(
            session => differenceInMinutes(new Date(session.starts_at), new Date()) > -60
        );

        return { upcomingSessions: upcoming };
    }, [sessions, currentUserId]);

    // Debug logs to check session data
    useEffect(() => {
        console.log('Total Scheduled Sessions:', sessions.length);
        console.log('Upcoming Sessions for User:', upcomingSessions.length);
    }, [sessions, upcomingSessions]);

    if (isLoadingProp) {
        return (
            <div className="w-full max-w-2xl mx-auto mb-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-[#1E1E1E] rounded w-1/3" />
                    <div className="h-24 bg-[#1E1E1E] rounded" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="w-full max-w-2xl mx-auto mb-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                {/* Found Session Section */}
                {foundSession && (
                    <div className="mb-8">
                        <SessionCard
                            session={foundSession}
                            currentUserId={currentUserId}
                            onJoinSession={onJoinSession}
                            onShareSession={setShareSession}
                            showFoundBadge={true}
                            onClose={onClearFoundSession}
                            onRefresh={handleRefresh}
                        />
                    </div>
                )}

                {/* User's Scheduled Sessions Section */}
                <div>
                    {upcomingSessions.length === 0 ? (
                        <div className="text-center text-[#A3A3A3] py-4">
                            No scheduled sessions available
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-white">
                                    Your Scheduled Sessions
                                </h2>
                                {upcomingSessions.length > 1 && (
                                    <Button
                                        variant="ghost"
                                        onClick={openViewAllDialog}
                                        className="text-[#6032F6] hover:text-[#4C28C4]"
                                    >
                                        View All ({upcomingSessions.length})
                                    </Button>
                                )}
                            </div>
                            {upcomingSessions.slice(0, 1).map(session => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    currentUserId={currentUserId}
                                    onJoinSession={onJoinSession}
                                    onShareSession={setShareSession}
                                    onRefresh={handleRefresh}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Session refresh button */}
                <div className="flex justify-end mb-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        className="text-[#A3A3A3] hover:text-white text-xs"
                        title="Refresh sessions list"
                    >
                        <span className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <path d="M21 2v6h-6"></path>
                                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                                <path d="M3 22v-6h6"></path>
                                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
                            </svg>
                            Refresh
                        </span>
                    </Button>
                </div>
            </div>

            {/* View All Dialog */}
            <Dialog 
                key={dialogKey}
                open={showAllSessions} 
                onOpenChange={setShowAllSessions}
            >
                <DialogContent className="bg-black border-[#2C2C2C] max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0">
                        <DialogTitle className="text-white">All Scheduled Sessions</DialogTitle>
                    </DialogHeader>
                    <div
                        className="space-y-4 overflow-y-auto flex-grow pr-2 pb-4"
                        style={{
                            maxHeight: 'calc(80vh - 100px)',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#666 #333'
                        }}
                    >
                        {foundSession && (
                            <div className="border-b border-[#2C2C2C] pb-4 mb-4">
                                <SessionCard
                                    session={foundSession}
                                    currentUserId={currentUserId}
                                    onJoinSession={onJoinSession}
                                    onShareSession={setShareSession}
                                    showFoundBadge={true}
                                    onClose={onClearFoundSession}
                                    onRefresh={handleRefresh}
                                />
                            </div>
                        )}

                        <div>
                            <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">
                                Your Sessions
                            </h3>
                            <div className="space-y-2">
                                {upcomingSessions.map(session => (
                                    <SessionCard
                                        key={session.id}
                                        session={session}
                                        currentUserId={currentUserId}
                                        onJoinSession={onJoinSession}
                                        onShareSession={setShareSession}
                                        onRefresh={handleRefresh}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            {shareSession && (
                <ShareDialog
                    isOpen={shareSession.isOpen}
                    onClose={() => setShareSession(null)}
                    sessionId={shareSession.sessionId}
                    sessionTitle={shareSession.sessionTitle}
                    startTime={shareSession.startTime}
                />
            )}
        </>
    );
}

function getButtonTitle(isCreator: boolean, canJoin: boolean, status?: string): string {
    if (!canJoin) {
        return 'Session can only be joined 5 minutes before start time';
    }
    if (!isCreator && status !== 'In progress') {
        return 'Only the host can join before the session starts';
    }
    return 'Join session';
}

function getButtonText(isCreator: boolean, canJoin: boolean, status?: string): string {
    if (!canJoin) {
        return 'Not started';
    }
    if (!isCreator && status !== 'In progress') {
        return 'Waiting for host';
    }
    return 'Join session';
}
