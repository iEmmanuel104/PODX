import { Server as SocketIOServer } from 'socket.io';

export function handleRedisMessage(io: SocketIOServer, data: Record<string, string>) {
    switch (data.type) {
    case 'user-joined':
        io.to(data.podId).emit('user-joined', { userId: data.userId });
        break;
    case 'user-left':
        io.to(data.podId).emit('user-left', { userId: data.userId });
        break;
    case 'pod-created':
        // Handle pod creation event if needed
        break;
    case 'pod-type-changed':
        io.to(data.podId).emit('pod-type-changed', { newType: data.newType, admittedUsers: data.admittedUsers });
        break;
    case 'content-updated':
        io.to(data.podId).emit('content-updated', { newIpfsContentHash: data.newIpfsContentHash });
        break;
    case 'user-info-updated':
        io.to(data.podId).emit('user-info-updated', { userId: data.userId, isAudioEnabled: data.isAudioEnabled, isVideoEnabled: data.isVideoEnabled });
        break;
        // Add more cases as needed
    }
}
