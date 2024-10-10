"use client";

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
let localStream: MediaStream | null = null;

export const initializeLocalStream = async (audioEnabled: boolean, videoEnabled: boolean) => {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: audioEnabled, video: videoEnabled });
    return localStream;
};

export const createPeerConnection = (userId: string, onTrack: (event: RTCTrackEvent) => void) => {
    const peerConnection = new RTCPeerConnection(webRTCConfig);
    peerConnections.set(userId, peerConnection);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            const socket = getSocket();
            if (socket) {
                socket.emit('signal', { to: userId, signal: { ice: event.candidate } });
            } else {
                console.error('Socket not initialized');
            }
        }
    };

    peerConnection.ontrack = onTrack;

    peerConnection.onconnectionstatechange = () => {
        if (peerConnection.connectionState === 'failed') {
            console.log('Connection failed, attempting to restart ICE');
            peerConnection.restartIce();
        }
    };

    if (localStream) {
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream!);
        });
    }

    return peerConnection;
};

export const addTracks = async (peerConnection: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
    });
};

export const createOffer = async (peerConnection: RTCPeerConnection) => {
    const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
    });
    await peerConnection.setLocalDescription(offer);
    return offer;
};

export const handleSignal = async (fromUserId: string, signal: any, onTrack: (event: RTCTrackEvent) => void) => {
    let peerConnection = peerConnections.get(fromUserId);

    if (!peerConnection) {
        peerConnection = createPeerConnection(fromUserId, onTrack);
    }

    if (signal.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        if (signal.sdp.type === 'offer') {
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            const socket = getSocket();
            if (socket) {
                socket.emit('signal', { to: fromUserId, signal: { sdp: answer } });
            } else {
                console.error('Socket not initialized');
            }
        }
    } else if (signal.ice) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice));
    }
};

export const startCall = async (targetUserId: string, onTrack: (event: RTCTrackEvent) => void) => {
    if (!localStream) {
        console.error('Local stream not initialized');
        return;
    }

    const peerConnection = createPeerConnection(targetUserId, onTrack);
    await addTracks(peerConnection, localStream);
    const offer = await createOffer(peerConnection);
    const socket = getSocket();
    if (socket) {
        socket.emit('signal', { to: targetUserId, signal: { sdp: offer } });
    } else {
        console.error('Socket not initialized');
    }
};

export const endCall = (userId: string) => {
    const peerConnection = peerConnections.get(userId);
    if (peerConnection) {
        peerConnection.close();
        peerConnections.delete(userId);
    }
};

export const toggleAudioTrack = (enabled: boolean) => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.enabled = enabled;
        });
    }
    peerConnections.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === 'audio') {
                sender.track.enabled = enabled;
            }
        });
    });
};

export const toggleVideoTrack = (enabled: boolean) => {
    if (localStream) {
        localStream.getVideoTracks().forEach(track => {
            track.enabled = enabled;
        });
    }
    peerConnections.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind === 'video') {
                sender.track.enabled = enabled;
            }
        });
    });
};

export const getActivePeerConnections = () => {
    return peerConnections;
};

export const cleanupPeerConnections = () => {
    peerConnections.forEach((pc, userId) => {
        pc.close();
    });
    peerConnections.clear();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
};

export const replaceTrack = async (kind: 'audio' | 'video', newTrack: MediaStreamTrack) => {
    if (localStream) {
        const oldTrack = localStream.getTracks().find(track => track.kind === kind);
        if (oldTrack) {
            localStream.removeTrack(oldTrack);
            localStream.addTrack(newTrack);

            peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track && s.track.kind === kind);
                if (sender) {
                    sender.replaceTrack(newTrack);
                }
            });
        }
    }
};