/* eslint-disable no-unused-vars */
import { BaseContract, BigNumberish, TransactionResponse } from 'ethers';

export interface PodXContract extends BaseContract {
    createPodcast(podcastId: string, ipfsContentHash: string): Promise<TransactionResponse>;
    joinPodcast(podcastId: string): Promise<TransactionResponse>;
    leavePodcast(podcastId: string): Promise<TransactionResponse>;
    updatePodcastContent(podcastId: string, newIpfsContentHash: string): Promise<TransactionResponse>;
    requestCoHost(podcastId: string): Promise<TransactionResponse>;
    approveCoHost(podcastId: string, coHostUserId: string): Promise<TransactionResponse>;
    sendTip(podcastId: string, recipientId: string, amount: BigNumberish): Promise<TransactionResponse>;
    // Add any other methods that your contract has
}

export interface PodMember {
    userId: string;
    socketId: string;
    name: string;
    walletAddress: string;
    displayImage: string;
    isAudioEnabled: boolean;
    isVideoEnabled: boolean;
}

export interface JoinRequest {
    userId: string;
    socketId: string;
    name: string;
    walletAddress: string;
    displayImage: string;
}

export type PodType = 'open' | 'trusted';

export interface Pod {
    id: string;
    owner: string;
    hosts: string[];
    ipfsContentHash: string;
    type: PodType;
    stats: {
        memberCount: number;
        hostCount: number;
        joinRequestCount: number;
        coHostRequestCount: number;
    };
}
