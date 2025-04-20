import React, { useEffect, useState } from 'react';
import { HuddleIframe } from "@huddle01/iframe";
import { createRoomUrl, debugHuddleConfig } from '../utils/huddle';

interface HuddleVideoCallProps {
  roomId: string;
  accessToken: string;
}

// Component for displaying a Huddle01 iframe with a specific room
const HuddleVideoCall: React.FC<HuddleVideoCallProps> = ({ roomId, accessToken }) => {
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Log debug info
    console.log('Joining room with ID:', roomId);
    console.log('Access token available:', !!accessToken);
    debugHuddleConfig();
  }, [roomId, accessToken]);
  
  return (
    <div className="huddle-container">
      {error && (
        <div className="error-message">
          Error: {error}
          <button onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}
      
      <div className="room-info">
        <h2>Meeting Room: {roomId}</h2>
        <p>Share this room ID with others to invite them.</p>
      </div>
      
      <HuddleIframe
        roomUrl={createRoomUrl(roomId)}
        className="huddle-iframe"
      />
      
      <div className="controls">
        <p>Control buttons are disabled until the iframe API is properly initialized.</p>
      </div>
    </div>
  );
};

export default HuddleVideoCall; 