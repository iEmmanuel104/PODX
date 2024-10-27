import type { StreamChat } from "stream-chat";
import type { StreamVideoClient } from "@stream-io/video-react-sdk";

export const MAX_POOL_SIZE = 2;

export class StreamConnectionPool {
    private chatClients: StreamChat[] = [];
    private videoClients: StreamVideoClient[] = [];
    private maxSize: number;

    constructor(maxSize: number = MAX_POOL_SIZE) {
        this.maxSize = maxSize;
    }

    async getChatClient(apiKey: string): Promise<StreamChat> {
        if (this.chatClients.length < this.maxSize) {
            const { StreamChat } = await import("stream-chat");
            const client = StreamChat.getInstance(apiKey);
            this.chatClients.push(client);
            return client;
        }
        return this.chatClients[Math.floor(Math.random() * this.chatClients.length)];
    }

    async getVideoClient(config: any): Promise<StreamVideoClient> {
        if (this.videoClients.length < this.maxSize) {
            const { StreamVideoClient } = await import("@stream-io/video-react-sdk");
            const client = new StreamVideoClient(config);
            this.videoClients.push(client);
            return client;
        }
        return this.videoClients[Math.floor(Math.random() * this.videoClients.length)];
    }

    disconnectAll() {
        this.chatClients.forEach(client => client.disconnectUser());
        this.videoClients.forEach(client => client.disconnectUser());
        this.chatClients = [];
        this.videoClients = [];
    }
}