import { 
  StreamVideoParticipant, 
  useCall, 
  useCallStateHooks, 
  OwnCapability 
} from '@stream-io/video-react-sdk';
import { useState, useEffect } from 'react';

export const useParticipantActions = (participant: StreamVideoParticipant) => {
  const call = useCall();
  const { useLocalParticipant, useHasPermissions } = useCallStateHooks();
  const localParticipant = useLocalParticipant();
  const isLocalUser = participant.userId === localParticipant?.userId;
  
  // Host permissions
  const canUpdatePermissions = useHasPermissions(OwnCapability.UPDATE_CALL_PERMISSIONS);
  // True if the current user is the host
  const isHost = canUpdatePermissions;
  
  // Check if participant has streams (indicating permissions)
  const [audioEnabled, setAudioEnabled] = useState(!!participant.audioStream);
  const [videoEnabled, setVideoEnabled] = useState(!!participant.videoStream);
  const [screenShareEnabled, setScreenShareEnabled] = useState(!!participant.screenShareStream);

  // Update local state when participant streams change
  useEffect(() => {
    setAudioEnabled(!!participant.audioStream);
    setVideoEnabled(!!participant.videoStream);
    setScreenShareEnabled(!!participant.screenShareStream);
  }, [participant.audioStream, participant.videoStream, participant.screenShareStream]);

  // Actions
  const toggleAudioPermission = async () => {
    if (!call || !canUpdatePermissions) return;
    try {
      // Update UI immediately for responsive feedback
      setAudioEnabled(!audioEnabled);
      
      if (audioEnabled) {
        await call.revokePermissions(participant.userId, [OwnCapability.SEND_AUDIO]);
      } else {
        await call.grantPermissions(participant.userId, [OwnCapability.SEND_AUDIO]);
      }
    } catch (error) {
      // Revert UI state if API call fails
      setAudioEnabled(audioEnabled);
      console.error('Failed to toggle audio permission:', error);
    }
  };

  const toggleVideoPermission = async () => {
    if (!call || !canUpdatePermissions) return;
    try {
      // Update UI immediately for responsive feedback
      setVideoEnabled(!videoEnabled);
      
      if (videoEnabled) {
        await call.revokePermissions(participant.userId, [OwnCapability.SEND_VIDEO]);
      } else {
        await call.grantPermissions(participant.userId, [OwnCapability.SEND_VIDEO]);
      }
    } catch (error) {
      // Revert UI state if API call fails
      setVideoEnabled(videoEnabled);
      console.error('Failed to toggle video permission:', error);
    }
  };

  const toggleScreenSharePermission = async () => {
    if (!call || !canUpdatePermissions) return;
    try {
      // Update UI immediately for responsive feedback
      setScreenShareEnabled(!screenShareEnabled);
      
      if (screenShareEnabled) {
        await call.revokePermissions(participant.userId, [OwnCapability.SCREENSHARE]);
      } else {
        await call.grantPermissions(participant.userId, [OwnCapability.SCREENSHARE]);
      }
    } catch (error) {
      // Revert UI state if API call fails
      setScreenShareEnabled(screenShareEnabled);
      console.error('Failed to toggle screen share permission:', error);
    }
  };

  const removeParticipant = async () => {
    if (!call || !canUpdatePermissions) return;
    try {
      // Block/kick the user from the call 
      // In Stream SDK 4.x+ use blockUser if available
      if (call.blockUser) {
        await call.blockUser(participant.userId);
      } else {
        // Fallback approach: revoke critical permissions to effectively kick them
        await call.revokePermissions(participant.userId, [
          OwnCapability.SEND_AUDIO,
          OwnCapability.SEND_VIDEO,
          OwnCapability.SCREENSHARE,
          OwnCapability.JOIN_CALL
        ]);
      }
    } catch (error) {
      console.error('Failed to remove participant:', error);
    }
  };

  // For users to request permissions
  const requestAudioPermission = async () => {
    if (!call) return;
    try {
      await call.requestPermissions({
        permissions: [OwnCapability.SEND_AUDIO]
      });
    } catch (error) {
      console.error('Failed to request audio permission:', error);
    }
  };

  return {
    // States
    isHost,
    isLocalUser,
    canSendAudio: audioEnabled,
    canSendVideo: videoEnabled,
    canScreenShare: screenShareEnabled, 
    
    // Actions
    toggleAudioPermission,
    toggleVideoPermission,
    toggleScreenSharePermission,
    removeParticipant,
    requestAudioPermission
  };
}; 