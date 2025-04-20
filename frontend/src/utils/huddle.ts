/**
 * Utility functions for Huddle01 integration
 */

// This is for environment variables type safety
declare global {
  interface Window {
    env: {
      REACT_APP_HUDDLE01_PROJECT_ID: string;
      REACT_APP_HUDDLE01_ROOM_ID: string;
      REACT_APP_HUDDLE01_ACCESS_TOKEN: string;
      REACT_APP_HUDDLE01_API_KEY: string;
    };
  }
  
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_HUDDLE01_PROJECT_ID: string;
      REACT_APP_HUDDLE01_ROOM_ID: string;
      REACT_APP_HUDDLE01_ACCESS_TOKEN: string;
      REACT_APP_HUDDLE01_API_KEY: string;
    }
  }
}

// Define types for role and permissions
export type HuddleRole = 'host' | 'coHost' | 'guest' | 'speaker' | 'listener';

export interface HuddlePermissions {
  admin?: boolean;
  canConsume?: boolean;
  canProduce?: boolean;
  canProduceSources?: {
    cam?: boolean;
    mic?: boolean;
    screen?: boolean;
  };
  canRecvData?: boolean;
  canSendData?: boolean;
  canUpdateMetadata?: boolean;
}

/**
 * Gets the Huddle01 configuration from environment variables
 */
export const getHuddleConfig = () => {
  return {
    projectId: process.env.REACT_APP_HUDDLE01_PROJECT_ID || '',
    roomId: process.env.REACT_APP_HUDDLE01_ROOM_ID || '',
    accessToken: process.env.REACT_APP_HUDDLE01_ACCESS_TOKEN || '',
    apiKey: process.env.REACT_APP_HUDDLE01_API_KEY || '',
  };
};

/**
 * Creates a room URL for Huddle01 iFrame
 */
export const createRoomUrl = (roomId: string): string => {
  return `https://iframe.huddle01.com/${roomId}`;
};

/**
 * Creates a new room using the Huddle01 API
 * Note: This should typically be done on the server side to protect your API key
 */
export const createRoom = async (metadata: Record<string, any> = {}) => {
  const { apiKey } = getHuddleConfig();
  
  if (!apiKey) {
    throw new Error("API key is required to create a room");
  }
  
  try {
    const response = await fetch('https://api.huddle01.com/api/v1/create-room', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        title: metadata.title || 'Huddle01 Meeting',
        roomLocked: metadata.roomLocked || false,
        hostWallets: metadata.hostWallets || [],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

/**
 * Gets an access token for a Huddle01 room
 * Note: This should typically be done on the server side to protect your API key
 */
export const getAccessToken = async (
  roomId: string, 
  role: HuddleRole = 'guest', 
  permissions?: HuddlePermissions,
  metadata: Record<string, any> = {}
) => {
  const { apiKey } = getHuddleConfig();
  
  if (!apiKey) {
    throw new Error("API key is required to get an access token");
  }
  
  try {
    // Default permissions if none provided
    const defaultPermissions: HuddlePermissions = {
      admin: role === 'host' || role === 'coHost',
      canConsume: true,
      canProduce: role !== 'listener',
      canProduceSources: {
        cam: role !== 'listener',
        mic: role !== 'listener',
        screen: role === 'host' || role === 'coHost' || role === 'guest',
      },
      canRecvData: true,
      canSendData: true,
      canUpdateMetadata: true,
    };
    
    const response = await fetch('https://api.huddle01.com/api/v1/get-access-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        roomId,
        role,
        permissions: permissions || defaultPermissions,
        metadata: JSON.stringify(metadata),
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get access token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

/**
 * Logs out relevant debug information about the Huddle01 configuration
 */
export const debugHuddleConfig = (): void => {
  const config = getHuddleConfig();
  console.log('Huddle01 Config:', {
    projectId: config.projectId ? 'Set' : 'Not set',
    roomId: config.roomId ? 'Set' : 'Not set',
    accessToken: config.accessToken ? 'Set' : 'Not set',
    apiKey: config.apiKey ? 'Set' : 'Not set',
  });
}; 