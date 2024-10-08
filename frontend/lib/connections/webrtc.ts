import { getSocket } from './socket';

export const webRTCConfig = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        {
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
        },
    ],
    iceCandidatePoolSize: 10,
};

const peerConnections = new Map<string, RTCPeerConnection>();

export const createPeerConnection = (userId: string) => {
    const peerConnection = new RTCPeerConnection(webRTCConfig);
    peerConnections.set(userId, peerConnection);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            getSocket().emit('signal', { to: userId, signal: { ice: event.candidate } });
        }
    };

    peerConnection.ontrack = (event) => {
        // Handle incoming tracks (audio/video)
        console.log('Received track', event.track.kind, 'from', userId);
        // You should update your UI here to display the new track
    };

    return peerConnection;
};

export const addTracks = async (peerConnection: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });
};

export const createOffer = async (peerConnection: RTCPeerConnection) => {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    return offer;
};

export const handleSignal = async (fromUserId: string, signal: any) => {
    let peerConnection = peerConnections.get(fromUserId);

    if (!peerConnection) {
        peerConnection = createPeerConnection(fromUserId);
    }

    if (signal.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            getSocket().emit('signal', { to: fromUserId, signal: { sdp: answer } });
        }
    } else if (signal.ice) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
};

export const startCall = async (targetUserId: string, stream: MediaStream) => {
    const peerConnection = createPeerConnection(targetUserId);
    await addTracks(peerConnection, stream);
    const offer = await createOffer(peerConnection);
    getSocket().emit('signal', { to: targetUserId, signal: { sdp: offer } });
};

export const endCall = (userId: string) => {
    const peerConnection = peerConnections.get(userId);
    if (peerConnection) {
        peerConnection.close();
        peerConnections.delete(userId);
    }
};

export const toggleAudioTrack = (enabled: boolean) => {
    peerConnections.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === 'audio') {
                sender.track.enabled = enabled;
            }
        });
    });
};

export const toggleVideoTrack = (enabled: boolean) => {
    peerConnections.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === 'video') {
                sender.track.enabled = enabled;
            }
        });
    });
};