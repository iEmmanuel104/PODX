// app/pod/index.tsx
"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { StreamVideoClient, GetCallResponse } from "@stream-io/video-react-sdk";
import { API_KEY } from "@/providers/meetProvider/streamMeetProvider";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { customAlphabet } from "nanoid";
import { AppContext } from "@/providers/appProvider";
import { clearSessionInfo, setSessionInfo } from "@/store/slices/podSlice";
import { sessionType } from "@/constants";
import { updateUser } from "@/store/slices/userSlice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useScheduledCalls } from "@/hooks/useScheduledCalls";
import { addScheduledSession } from "@/store/slices/scheduledSessionSlice";
import { StreamCallData } from "@/components/pod/streamCallData";
import { useStreamTokenProvider } from "@/hooks/useStreamTokenProvider";
import OnboardingStep from "@/components/user/OnboardingStep";
import { onboardingSteps } from "@/constants/globals";
import PlayAdd from "@/assets/icons/PlayAdd";
import DotPattern from "@/components/ui/dot-pattern";
import { cn } from "@/lib/utils";
import Fire from "@/assets/icons/Fire";
import Info from "@/assets/icons/Info";

// Dynamic imports
const CreateSessionModal = dynamic(
  () => import("@/components/pod/createSessionModal"),
  { ssr: false }
);
const CreatedSessionModal = dynamic(
  () => import("@/components/pod/createdSessionModal"),
  { ssr: false }
);
const UserInfoModal = dynamic(() => import("@/components/user/userInfoModal"), {
  ssr: false,
});
const Logo = dynamic(() => import("@/components/ui/logo"), { ssr: false });
const UserDetails = dynamic(() => import("@/components/user/userDetails"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-2xl h-16 bg-[#1E1E1E] rounded-lg animate-pulse" />
  ),
});
const ScheduledPods = dynamic(() => import("@/components/pod/scheduledPods"), {
  ssr: false,
});

// Error Message Component
const ErrorMessage = ({
  message,
  onClear,
}: {
  message: string;
  onClear: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 3000);
    return () => clearTimeout(timer);
  }, [message, onClear]);

  return message ? (
    <div className="text-red-500 text-sm mt-2">{message}</div>
  ) : null;
};

// Utility functions
const getMeetingId = () => {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(alphabet, 4);
  return `${nanoid(3)}-${nanoid(4)}-${nanoid(3)}`;
};

interface SessionData {
  title: string;
  type: sessionType;
  sessionId: string;
  starts_at?: string;
  isScheduled?: boolean;
}

export default function PodPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setNewMeeting } = React.useContext(AppContext);
  const { isLoggedIn, user } = useAppSelector((state) => state.user);
  const sessionInfo = useAppSelector((state) => state.pod);
  const { scheduledSessions, scheduleCall, getScheduledCall, isLoading } =
    useScheduledCalls();
  const tokenProvider = useStreamTokenProvider();
  const [activeStep, setActiveStep] = useState(1);
  const [showOnboarding, setShowOnboarding] = useState(true);

  const [state, setState] = useState({
    meetingCode: "",
    error: "",
    inviteLink: "",
    sessionCode: "",
    isJoining: false,
    isJoiningCreated: false,
    isCreateModalOpen: false,
    isCreatedModalOpen: false,
    showUsernameModal: false,
    isOpenDialogue: false,
    foundSession: undefined as StreamCallData | undefined,
  });

  useEffect(() => {
    if (isLoggedIn && user?.username?.startsWith("guest-")) {
      setShowOnboarding(true);
    }
  }, [isLoggedIn, user]);

  const handleStreamCall = useCallback(
    (response: GetCallResponse) => {
      if (
        response.call &&
        state.meetingCode === response.call.custom.sessionId
      ) {
        dispatch(
          setSessionInfo({
            title: response.call.custom.title,
            type: response.call.custom.type,
            sessionId: state.meetingCode,
            starts_at: response.call.starts_at,
          })
        );
        router.push(`/pod/join/${state.meetingCode}`);
      }
    },
    [dispatch, router, state.meetingCode]
  );

  const handleScheduledCall = useCallback(
    (call: StreamCallData) => {
      if (!call?.custom) return;

      dispatch(addScheduledSession(call));
      dispatch(
        setSessionInfo({
          title: call.custom.title,
          type: call.custom.type as sessionType,
          sessionId: state.meetingCode,
          starts_at: call.starts_at,
        })
      );
      router.push(`/pod/join/${state.meetingCode}`);
    },
    [dispatch, router, state.meetingCode]
  );

  const handleCreateSession = useCallback(
    async (title: string, type: sessionType, scheduledDate?: Date) => {
      dispatch(clearSessionInfo());
      setNewMeeting(true);
      const newSessionCode = getMeetingId();

      const sessionData: SessionData = {
        title,
        type,
        sessionId: newSessionCode,
        isScheduled: !!scheduledDate,
      };

      if (scheduledDate) {
        const startDate = new Date(
          Math.max(scheduledDate.getTime(), Date.now() + 60000)
        );
        sessionData.starts_at = startDate.toISOString();

        try {
          const result = await scheduleCall({
            title,
            type,
            sessionId: newSessionCode,
            starts_at: startDate.toISOString(),
          });

          if (!result.data) {
            throw new Error("Failed to schedule call");
          }

          dispatch(setSessionInfo(sessionData));
          setState((prev) => ({
            ...prev,
            isCreateModalOpen: false,
          }));

          // Don't redirect for scheduled sessions
          return;
        } catch (error) {
          console.error("Failed to schedule call:", error);
          setState((prev) => ({
            ...prev,
            error: "Failed to schedule the call",
          }));
          return;
        }
      }

      // Only set invite link and show created modal for instant sessions
      setState((prev) => ({
        ...prev,
        inviteLink: `https://www.podx.fun/pod/join/${newSessionCode}`,
        sessionCode: newSessionCode,
        isCreateModalOpen: false,
        isCreatedModalOpen: true,
      }));

      dispatch(setSessionInfo(sessionData));
    },
    [dispatch, setNewMeeting, scheduleCall]
  );

  const handleJoinSession = useCallback(async () => {
    if (!state.meetingCode || !user) return;

    setState((prev) => ({ ...prev, isJoining: true, error: "" }));
    dispatch(clearSessionInfo());

    try {
      const token = await tokenProvider(user.walletAddress);

      // First try Stream.io
      const client = new StreamVideoClient({
        apiKey: API_KEY,
        user: {
          id: user.id,
          name: user.username,
        },
        tokenProvider: async () => token,
      });

      try {
        console.log("Checking Stream.io for call");
        const { calls } = await client.queryCalls({
          filter_conditions: { id: state.meetingCode },
        });

        if (calls.length > 0 && calls[0].id === state.meetingCode) {
          console.log("Call found in Stream.io");
          const response: GetCallResponse = await calls[0].get();
          handleStreamCall(response);
          return;
        }
      } catch (streamError) {
        console.log("Stream.io call not found, checking scheduled calls...");
      }

      // Then check Redis scheduled calls
      try {
        console.log("checking server for scheduled call");
        const { data } = await getScheduledCall(state.meetingCode);

        if (data?.call) {
          setState((prev) => ({ ...prev, foundSession: data.call }));
          return;
        }
      } catch (redisError) {
        console.log("Scheduled call not found in Server");
      }

      setState((prev) => ({
        ...prev,
        error: "Couldn't find the meeting you're trying to join.",
      }));
    } catch (error) {
      console.error("Join session error:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to join meeting",
      }));
    } finally {
      setState((prev) => ({ ...prev, isJoining: false }));
    }
  }, [
    state.meetingCode,
    user,
    dispatch,
    tokenProvider,
    handleStreamCall,
    getScheduledCall,
  ]);

  const handleJoinCreatedSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isJoiningCreated: true }));
    try {
      router.push(`/pod/join/${state.sessionCode}`);
    } catch (error) {
      console.error("Failed to join created session:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to join session. Please try again.",
      }));
    } finally {
      setState((prev) => ({ ...prev, isJoiningCreated: false }));
    }
  }, [state.sessionCode]);

  const handleUpdateUsername = useCallback(
    (newUsername: string) => {
      setState((prev) => ({ ...prev, showUsernameModal: false }));
      dispatch(updateUser({ username: newUsername }));
    },
    [dispatch]
  );

  const handleClearFoundSession = useCallback(() => {
    setState((prev) => ({ ...prev, foundSession: undefined }));
  }, []);

  const handleSkipOnboarding = () => {
    setShowOnboarding(false);
    setState((prev) => ({ ...prev, showUsernameModal: true }));
  };

  const handleNextStep = () => {
    if (activeStep === onboardingSteps.length) {
      setShowOnboarding(false);
      setState((prev) => ({ ...prev, showUsernameModal: true }));
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  if (!isLoggedIn || !user) {
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <div className="flex flex-col gap-[140px]">
          <div className="flex flex-col gap-[187px]">
               {/* User details section */}
      <UserDetails user={user} />

            {/* Main grid container */}
            <div className="w-full flex flex-col md:flex-row  gap-[24px]">
              {/* Join Session Card */}
              <div className="w-full rounded-[20px] p-[32px] bg-[#1E1E1E] flex flex-col gap-[100px]">
                <div className="flex flex-col gap-[12px]">
                  <h2 className="text-[32px] leading-9 font-semibold text-[#d4d4d4] max-w-[123px]">
                    Join Session
                  </h2>
                  <p className="text-[#A7A7A7] max-w-[254px] font-medium">
                    Join a meeting instantly and collaborate
                  </p>
                </div>
                <div className="flex flex-col gap-4 mt-4">
                  <div className="flex flex-col items-center sm:flex-row gap-4">
                    <Input
                      type="text"
                      placeholder="Enter meeting code"
                      value={state.meetingCode}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          meetingCode: e.target.value,
                        }))
                      }
                      className="flex-1 bg-[#2C2C2C] rounded-[10px] px-4 py-2 text-sm border-[#3c3c3c] focus-within:border-[#3c3c3c] focus:border-[#3c3c3c] focus:ring-[#3c3c3c] text-white placeholder-[#6C6C6C]"
                    />
                    <Button
                      onClick={handleJoinSession}
                      disabled={!state.meetingCode || state.isJoining}
                      className="bg-gradient-to-r from-[#6032f6] to-[#381d90] text-white px-[16px] py-[12px] rounded-[10px] hover:bg-[#4C28C4] transition-all duration-300 ease-in-out text-sm font-medium disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                      {state.isJoining ? "Joining..." : "Join"}
                    </Button>
                  </div>
                  <ErrorMessage
                    message={state.error}
                    onClear={() => setState((prev) => ({ ...prev, error: "" }))}
                  />
                </div>
              </div>

              {/* Create Session Card */}
              <div className="relative w-full rounded-[20px] p-[32px] bg-gradient-to-br from-[#6032F6] to-[#381D90]">
                <DotPattern
                         width={20}
                         height={20}
                          cx={2}
                          cy={2}
                          cr={1}
                          className={cn(
                            "[mask-image:radial-gradient(to_bottom_right,white,transparent,transparent)] rounded-[20px] top-[6px] left-[8px] px-[10px]"
                          )}
                        />
                <div className="flex flex-col gap-[24px]">
                  <div className="icon-container h-[46px] w-[46px]">
                    <PlayAdd />
                  </div>
                  <div className="flex flex-col gap-[12px]">
                    <h2 className="text-[32px] leading-9 font-semibold text-[#d4d4d4] max-w-[122px]">
                      Create Session
                    </h2>
                    <p className="text-[#CEBFFF] max-w-[269px] font-medium">
                      Start a meeting or podcast session in seconds -
                      collaborate, share, and record with ease!
                    </p>
                  </div>
                  <div>
                    <Button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          isCreateModalOpen: true,
                        }))
                      }
                      className="bg-[#DDB958] hover:bg-[#DDB958] text-black font-semibold py-[12px] px-[16px] rounded-[10px] transition-colors duration-300"
                    >
                      Create Session
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session streak dialog */}
          <Dialog
            open={state.isOpenDialogue}
            onOpenChange={(open) =>
              setState((prev) => ({ ...prev, isOpenDialogue: open }))
            }
          >
             <DialogTrigger className="max-w-[275px] mx-auto"
              asChild
            >
              <div className="flex justify-center items-center">
              <div className="rounded-full bg-gradient-to-r from-[#552FC9]  to-[#D7B35D] p-[1px]">
              <Button
                variant="ghost"
                className="flex justify-between items-center rounded-full bg-[#212121] text-white text-xs tracking-wider py-[4px] px-[16px]"
              >
                <div className="h-[14px] w-[14px]">
                  <Fire/>
                </div>
                <span>You have no session streak</span>
                <div className="icon-container h-[14px] w-[14px]">
                  <Info/>
                </div>
              </Button>
              </div>
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-[#1E1E1E] text-white border border-[#2E2E2E] p-0 rounded-[10px]">
              <div className="p-6 flex flex-col items-center gap-4">
                <div className="h-[14px] w-[14px]">
                  <Fire/>
                </div>
                <DialogTitle className="text-4xl text-center font-bold mb-1">
                  0 day
                </DialogTitle>
                <div className="flex flex-col items-center gap-2 mt-4">
                  <DialogHeader>
                    <DialogDescription className="text-[#A3A3A3] text-lg">
                      Session Streak
                    </DialogDescription>
                  </DialogHeader>
                  <DialogDescription className="text-center text-[#A3A3A3] mb-6">
                    Session streaks are consecutive daily sessions that are
                    either created or attended.
                  </DialogDescription>
                </div>
                <Button
                  className="w-full bg-[#6032F6] hover:bg-[#4C28C4] text-white rounded-[10px] py-2 px-4"
                  onClick={() =>
                    setState((prev) => ({ ...prev, isOpenDialogue: false }))
                  }
                >
                  I understand.
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {onboardingSteps.map(
          (step, index) =>
            activeStep === step.id && (
              <OnboardingStep
                showOnboarding={showOnboarding}
                skipFunc={handleSkipOnboarding}
                nextFunc={handleNextStep}
                stepsLength={onboardingSteps.length}
                {...step}
                activeStep={activeStep}
                key={index}
              />
            )
        )}
      </div>

      {/* Scheduled sessions */}
      <ScheduledPods
        sessions={scheduledSessions}
        foundSession={state.foundSession}
        onJoinSession={(sessionId) => router.push(`/pod/join/${sessionId}`)}
        currentUserId={user?.id}
        isLoading={isLoading}
        onClearFoundSession={handleClearFoundSession}
      />

      {/* Modals */}
      <React.Suspense fallback={null}>
        {state.isCreateModalOpen && (
          <CreateSessionModal
            isOpen={state.isCreateModalOpen}
            onClose={() =>
              setState((prev) => ({ ...prev, isCreateModalOpen: false }))
            }
            onCreateSession={handleCreateSession}
          />
        )}

        {state.isCreatedModalOpen && (
          <CreatedSessionModal
            isOpen={state.isCreatedModalOpen}
            onClose={() =>
              setState((prev) => ({ ...prev, isCreatedModalOpen: false }))
            }
            inviteLink={state.inviteLink}
            sessionCode={state.sessionCode}
            isJoining={state.isJoiningCreated}
            onJoinSession={handleJoinCreatedSession}
            scheduledTime={sessionInfo.starts_at}
          />
        )}

        {user && state.showUsernameModal && (
          <UserInfoModal
            isOpen={state.showUsernameModal}
            onClose={() =>
              setState((prev) => ({ ...prev, showUsernameModal: false }))
            }
            initialUsername={user.username}
            onUpdate={handleUpdateUsername}
          />
        )}
      </React.Suspense>
    </div>
  );
}
