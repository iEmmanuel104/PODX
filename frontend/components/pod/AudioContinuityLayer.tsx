import React, { useEffect, useRef } from 'react';
import { Audio, StreamVideoParticipant } from '@stream-io/video-react-sdk';

/**
 * AudioContinuityLayer maintains audio streams across layout transitions.
 * This component ensures that audio continues playing smoothly even when
 * participants move between the main grid and overflow sections.
 */
interface AudioContinuityLayerProps {
  participants: StreamVideoParticipant[];
}

const AudioContinuityLayer: React.FC<AudioContinuityLayerProps> = ({ participants }) => {
  // Keep track of participants whose audio we've initialized
  const trackedParticipantsRef = useRef<Set<string>>(new Set());
  
  // Use a ref to track speaking participants to reduce unnecessary re-renders
  const speakingParticipantsRef = useRef<Map<string, number>>(new Map());
  
  // Update our tracking when participants list changes
  useEffect(() => {
    // Add all current participants to our tracked set
    participants.forEach(p => {
      trackedParticipantsRef.current.add(p.sessionId);
      
      // Track speaking participants with a timestamp
      if (p.isSpeaking) {
        speakingParticipantsRef.current.set(p.sessionId, Date.now());
      }
    });
    
    // Cleanup old speaking timestamps after a delay
    const now = Date.now();
    speakingParticipantsRef.current.forEach((timestamp, id) => {
      // Keep speaking state for 2 seconds after they stop speaking
      // This provides a buffer for transitions
      if (now - timestamp > 2000 && !participants.some(p => p.sessionId === id && p.isSpeaking)) {
        speakingParticipantsRef.current.delete(id);
      }
    });
    
    // Return cleanup function
    return () => {
      // No need to clean up refs as they persist between renders
    };
  }, [participants]);
  
  return (
    <div className="sr-only">
      {/* 
        Render audio components for all participants to ensure continuity 
        By placing these in a screen-reader-only div, they don't affect the visual layout
        but continue to process audio
      */}
      {participants.map(participant => (
        <Audio 
          key={participant.sessionId} 
          participant={participant} 
          trackType="audioTrack" 
        />
      ))}
    </div>
  );
};

export default AudioContinuityLayer; 