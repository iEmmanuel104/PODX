import React, { useState } from 'react';
import HuddleVideoCall from './components/HuddleVideoCall';
import CreateRoom from './components/CreateRoom';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/App.css';

function App() {
  const [roomData, setRoomData] = useState<{ roomId: string; accessToken: string } | null>(null);

  const handleRoomCreated = (roomId: string, accessToken: string) => {
    setRoomData({ roomId, accessToken });
    
    // Save the room data to localStorage for persistence
    localStorage.setItem('podx-room-data', JSON.stringify({ roomId, accessToken }));
  };

  // Try to load room data from localStorage on component mount
  React.useEffect(() => {
    const savedRoomData = localStorage.getItem('podx-room-data');
    if (savedRoomData) {
      try {
        setRoomData(JSON.parse(savedRoomData));
      } catch (err) {
        console.error('Error parsing saved room data:', err);
        localStorage.removeItem('podx-room-data');
      }
    }
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>PODX Video Conferencing</h1>
        {roomData && (
          <button 
            className="leave-button"
            onClick={() => {
              setRoomData(null);
              localStorage.removeItem('podx-room-data');
            }}
          >
            Leave Room
          </button>
        )}
      </header>
      <main className="app-main">
        <ErrorBoundary>
          {roomData ? (
            <HuddleVideoCall 
              roomId={roomData.roomId} 
              accessToken={roomData.accessToken} 
            />
          ) : (
            <CreateRoom onRoomCreated={handleRoomCreated} />
          )}
        </ErrorBoundary>
      </main>
      <footer className="app-footer">
        <p>Powered by Huddle01</p>
      </footer>
    </div>
  );
}

export default App; 