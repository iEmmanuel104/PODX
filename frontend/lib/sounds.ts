const joinSound = new Audio('/sounds/join.mp3');
const leaveSound = new Audio('/sounds/leave.mp3');

export const playJoinSound = () => {
    joinSound.currentTime = 0;
    joinSound.volume = 0.5;
    joinSound.play().catch(error => {
        console.error('Error playing join sound:', error);
    });
};

export const playLeaveSound = () => {
    leaveSound.currentTime = 0;
    leaveSound.volume = 0.5;
    leaveSound.play().catch(error => {
        console.error('Error playing leave sound:', error);
    });
};
