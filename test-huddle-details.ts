import { API } from '@huddle01/server-sdk/api';

async function testGetRoomDetails() {
    try {
        const api = new API({
            apiKey: 'ak_voxehznrlqvsrlzk',
        });

        console.log('API initialized successfully');

        const roomDetails = await api.getRoomDetails({
            roomId: 'mqf-wsbf-ezc',
        });

        console.log('Room details:', roomDetails);
    } catch (error) {
        console.error('Error getting room details:', error);
    }
}

testGetRoomDetails();