import React, { useEffect, useCallback, useState } from 'react';
import {
    VideoPreview,
    useCallStateHooks,
    useConnectedUser,
    createSoundDetector,
} from '@stream-io/video-react-sdk';
import SpeechIndicator from './speechIndicator';
import { Mic, MicOff, Video, VideoOff, MoreVertical, Sparkles, Volume2 } from 'lucide-react';
import {
    AudioInputDeviceSelector,
    AudioOutputDeviceSelector,
    VideoInputDeviceSelector,
} from './deviceSelector';
import DeviceSelectorPopover from '@/components/join/deviceSelectorPopover';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { setAudioEnabled, setSoundDetected, setVideoEnabled } from '@/store/media/slice';
import { useAppDispatch, useTypedSelector } from '@/store/config/store';
import { setToast } from '@/store/toast/slice';

const MeetingPreview: React.FC = () => {
    const user = useConnectedUser();
    const dispatch = useAppDispatch();
    const { isAudioEnabled, isVideoEnabled, isSoundDetected } = useTypedSelector(
        state => state.media
    );
    const { streamCallType } = useTypedSelector(state => state.pod);
    const isAudioSession = streamCallType === 'audio_room';
    const toast = useTypedSelector(state => state.toast);
    const [videoPreviewText, setVideoPreviewText] = useState('');
    const [isInitializing, setIsInitializing] = useState(true);

    const { useCameraState, useMicrophoneState, useSpeakerState } = useCallStateHooks();
    const { camera, hasBrowserPermission: hasCameraPermission } = useCameraState();
    const {
        microphone,
        hasBrowserPermission: hasMicrophonePermission,
        status: microphoneStatus,
        mediaStream,
    } = useMicrophoneState();
    const { speaker } = useSpeakerState();

    // Initialize devices
    useEffect(() => {
        const initializeDevices = async () => {
            setIsInitializing(true);

            try {
                // Log the current Redux state for debugging
                console.debug('Initial media state from Redux:', { isAudioEnabled, isVideoEnabled });
                
                // Camera initialization - respect existing Redux state
                if (!isAudioSession && hasCameraPermission && camera) {
                    if (isVideoEnabled) {
                        await camera.enable();
                        console.debug('Camera enabled on preview initialization');
                    } else {
                        await camera.disable();
                        console.debug('Camera disabled on preview initialization (respecting previous setting)');
                    }
                    // No need to update Redux state since we're using its value
                }

                // Microphone initialization - respect existing Redux state
                if (hasMicrophonePermission && microphone) {
                    if (isAudioEnabled) {
                        await microphone.enable();
                        console.debug('Microphone enabled on preview initialization');
                    } else {
                        await microphone.disable();
                        console.debug('Microphone disabled on preview initialization (respecting previous setting)');
                    }
                    // No need to update Redux state since we're using its value
                }
            } catch (error) {
                console.error('Device initialization error:', error);
                dispatch(
                    setToast(
                        `Device error: ${error instanceof Error ? error.message : String(error)}`
                    )
                );
            } finally {
                setIsInitializing(false);
            }
        };

        initializeDevices();

        return () => {
            if (camera?.enabled) camera.disable().catch(console.error);
            if (microphone?.enabled) microphone.disable().catch(console.error);
        };
    }, [
        camera,
        microphone,
        hasCameraPermission,
        hasMicrophonePermission,
        dispatch,
        isAudioSession,
        isAudioEnabled,
        isVideoEnabled,
    ]);

    const AudioSessionPreview = () => (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#6032F6]/20 to-[#381D90]/20">
            <div className="w-20 h-20 rounded-full bg-[#6032F6]/20 flex items-center justify-center mb-4">
                <Mic className="w-10 h-10 text-white/80" />
            </div>
            <div className="text-xl text-white/90 font-medium">Audio Session</div>
            <div className="text-sm text-white/60 mt-2">
                {isAudioEnabled ? 'Your microphone is enabled' : 'Your microphone is muted'}
            </div>
        </div>
    );

    // Sound detector setup
    useEffect(() => {
        if (!hasMicrophonePermission || microphoneStatus !== 'enabled' || !mediaStream) return;

        let isMounted = true;
        const disposeSoundDetector = createSoundDetector(
            mediaStream,
            ({ isSoundDetected: sd }) => {
                if (isMounted) dispatch(setSoundDetected(sd));
            },
            {
                detectionFrequencyInMs: 80,
                destroyStreamOnStop: false,
            }
        );

        return () => {
            isMounted = false;
            disposeSoundDetector().catch(console.error);
        };
    }, [microphoneStatus, mediaStream, dispatch, hasMicrophonePermission]);

    const toggleAudio = useCallback(async () => {
        if (!hasMicrophonePermission) {
            dispatch(setToast('Microphone permission not granted'));
            return;
        }

        try {
            // Toggle microphone state
            const newState = !isAudioEnabled;
            
            // Update Redux state first
            dispatch(setAudioEnabled(newState));
            
            // Save to localStorage to persist across page transitions
            localStorage.setItem('podMeetingAudioEnabled', String(newState));
            
            // Then update the device
            if (newState) {
                await microphone.enable();
                console.debug('Microphone enabled in preview');
            } else {
                await microphone.disable();
                console.debug('Microphone disabled in preview');
            }
        } catch (error) {
            // If there was an error, revert the state
            dispatch(setAudioEnabled(isAudioEnabled));
            dispatch(setToast(`Microphone toggle error: ${String(error)}`));
        }
    }, [microphone, dispatch, isAudioEnabled, hasMicrophonePermission]);

    const toggleVideo = useCallback(async () => {
        if (!hasCameraPermission) {
            dispatch(setToast('Camera permission not granted'));
            return;
        }

        try {
            // Toggle camera state
            const newState = !isVideoEnabled;
            
            // Update text before toggling
            setVideoPreviewText(newState ? 'Camera is starting' : 'Camera is turning off');
            
            // Update Redux state first
            dispatch(setVideoEnabled(newState));
            
            // Save to localStorage to persist across page transitions
            localStorage.setItem('podMeetingVideoEnabled', String(newState));
            
            // Then update the device
            if (newState) {
                await camera.enable();
                setVideoPreviewText('');
                console.debug('Camera enabled in preview');
            } else {
                await camera.disable();
                setVideoPreviewText('Camera is off');
                console.debug('Camera disabled in preview');
            }
        } catch (error) {
            // If there was an error, revert the state
            dispatch(setVideoEnabled(isVideoEnabled));
            dispatch(setToast(`Camera toggle error: ${String(error)}`));
            setVideoPreviewText('Camera error occurred');
        }
    }, [camera, dispatch, isVideoEnabled, hasCameraPermission]);

    if (isInitializing) {
        return (
            <div className="w-full max-w-3xl lg:pr-2 lg:mt-8 flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl lg:pr-2 lg:mt-8">
            {toast.isVisible && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{toast.message}</AlertDescription>
                </Alert>
            )}
            <div className="relative w-full rounded-[10px] aspect-video mx-auto shadow-md overflow-hidden">
                <div className="absolute inset-0 bg-[#121212]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[rgba(0,0,0,0.4)]" />

                {/* Conditional rendering based on session type */}
                {isAudioSession ? (
                    <AudioSessionPreview />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center [&_video]:-scale-x-100">
                        <VideoPreview
                            DisabledVideoPreview={() => (
                                <div className="text-2xl text-white">
                                    {videoPreviewText ||
                                        (isVideoEnabled
                                            ? 'Camera is starting...'
                                            : 'Camera is off')}
                                </div>
                            )}
                        />
                    </div>
                )}

                {/* User name with speech indicator */}
                <div className="absolute left-2 top-2 max-w-[80%] flex items-center">
                    <SpeechIndicator
                        isSpeaking={isSoundDetected}
                        isMicrophoneEnabled={microphoneStatus === 'enabled'}
                    />
                    <span className="relative mr-2 text-white text-xs font-thin truncate max-w-[120px]">
                        {(() => {
                            const name = user?.name || 'Anonymous';
                            return name.length > 12 ? `${name.slice(0, 12)}...` : name;
                        })()}
                        <span
                            className={`absolute -right-2 top-1/2 transform -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                                hasMicrophonePermission ? 'bg-[#6032F6]' : 'bg-red-500'
                            }`}
                        ></span>
                    </span>
                </div>

                {/* Top right controls */}
                <div className="absolute top-4 right-4 flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="w-10 h-10 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                    >
                        <Sparkles className="w-5 h-5" />
                    </Button>
                </div>

                {/* Bottom controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                    {!isAudioSession && (
                        <DeviceSelectorPopover
                            icon={
                                isVideoEnabled ? (
                                    <Video className="w-4 h-4" />
                                ) : (
                                    <VideoOff className="w-4 h-4" />
                                )
                            }
                            onClick={toggleVideo}
                            className="w-full h-8 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                        >
                            <VideoInputDeviceSelector disabled={!hasCameraPermission} />
                        </DeviceSelectorPopover>
                    )}

                    <DeviceSelectorPopover
                        icon={
                            isAudioEnabled ? (
                                <Mic className="w-4 h-4" />
                            ) : (
                                <MicOff className="w-4 h-4" />
                            )
                        }
                        onClick={toggleAudio}
                        className="w-full h-8 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                    >
                        <AudioInputDeviceSelector disabled={!hasMicrophonePermission} />
                    </DeviceSelectorPopover>

                    <DeviceSelectorPopover
                        icon={<Volume2 className="w-4 h-4" />}
                        onClick={toggleAudio}
                        className="w-full h-8 rounded-full bg-black/20 border-white/10 hover:bg-black/30 hover:border-white/20"
                    >
                        <AudioOutputDeviceSelector disabled={!hasMicrophonePermission} />
                    </DeviceSelectorPopover>
                </div>
            </div>
        </div>
    );
};

export default MeetingPreview;
