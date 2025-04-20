import { API } from '@huddle01/server-sdk/api';

async function testCreateRoom() {
    try {
        const api = new API({
            apiKey: 'ak_voxehznrlqvsrlzk',
        });

        console.log('API initialized successfully');

        const newRoom = await api.createRoom({
            roomLocked: true,
            metadata: JSON.stringify({
                title: 'Test Meeting ' + new Date().toISOString(),
            }),
        });

        console.log('Room created successfully:', newRoom);
    } catch (error) {
        console.error('Error creating room:', error);
    }
}

testCreateRoom();