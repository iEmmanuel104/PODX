import React, { useState } from 'react';
import { createRoom, getAccessToken } from '../utils/huddle';

interface CreateRoomProps {
  onRoomCreated: (roomId: string, accessToken: string) => void;
}

const CreateRoom: React.FC<CreateRoomProps> = ({ onRoomCreated }) => {
  const [title, setTitle] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Create the room
      const roomData = await createRoom({
        title: title || 'PODX Meeting',
        roomLocked: isLocked,
      });

      // Get an access token for the created room
      const accessToken = await getAccessToken(
        roomData.data.roomId,
        'host',
        {
          admin: true,
          canConsume: true,
          canProduce: true,
          canProduceSources: {
            cam: true,
            mic: true,
            screen: true,
          },
          canRecvData: true,
          canSendData: true,
          canUpdateMetadata: true,
        },
        {
          displayName: 'Room Host',
          userId: `user-${Date.now()}`,
        }
      );

      // Notify parent component
      onRoomCreated(roomData.data.roomId, accessToken);
    } catch (err) {
      console.error('Error creating room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-room-container">
      <h2>Create a New Meeting Room</h2>
      
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      
      <form onSubmit={handleCreateRoom}>
        <div className="form-group">
          <label htmlFor="title">Meeting Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="My PODX Meeting"
          />
        </div>
        
        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="isLocked"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
          />
          <label htmlFor="isLocked">Lock Room (require permission to join)</label>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="create-button"
        >
          {isLoading ? 'Creating...' : 'Create Meeting Room'}
        </button>
      </form>
    </div>
  );
};

export default CreateRoom; 