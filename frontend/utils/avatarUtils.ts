import fs from 'fs';
import path from 'path';

let cachedAvatars: string[] | null = null;

// Define default avatars with all available images
const defaultAvatars = [
    // Original Oval series
    '/icons/Avatar/Oval-1.png',
    '/icons/Avatar/Oval-2.png',
    '/icons/Avatar/Oval-3.png',
    '/icons/Avatar/Oval-4.png',
    '/icons/Avatar/Oval-5.png',
    '/icons/Avatar/Oval-6.png',
    '/icons/Avatar/Oval-7.png',
    '/icons/Avatar/Oval-8.png',
    '/icons/Avatar/Oval-9.png',
    '/icons/Avatar/Oval-10.png',
    '/icons/Avatar/Oval.png',
    
    // Group series (32-67)
    '/icons/Avatar/Group 32.png',
    '/icons/Avatar/Group 33.png',
    '/icons/Avatar/Group 34.png',
    '/icons/Avatar/Group 35.png',
    '/icons/Avatar/Group 36.png',
    '/icons/Avatar/Group 37.png',
    '/icons/Avatar/Group 38.png',
    '/icons/Avatar/Group 39.png',
    '/icons/Avatar/Group 40.png',
    '/icons/Avatar/Group 41.png',
    '/icons/Avatar/Group 42.png',
    '/icons/Avatar/Group 43.png',
    '/icons/Avatar/Group 44.png',
    '/icons/Avatar/Group 45.png',
    '/icons/Avatar/Group 46.png',
    '/icons/Avatar/Group 47.png',
    '/icons/Avatar/Group 48.png',
    '/icons/Avatar/Group 49.png',
    '/icons/Avatar/Group 50.png',
    '/icons/Avatar/Group 51.png',
    '/icons/Avatar/Group 52.png',
    '/icons/Avatar/Group 53.png',
    '/icons/Avatar/Group 54.png',
    '/icons/Avatar/Group 55.png',
    '/icons/Avatar/Group 56.png',
    '/icons/Avatar/Group 57.png',
    '/icons/Avatar/Group 58.png',
    '/icons/Avatar/Group 59.png',
    '/icons/Avatar/Group 60.png',
    '/icons/Avatar/Group 61.png',
    '/icons/Avatar/Group 62.png',
    '/icons/Avatar/Group 63.png',
    '/icons/Avatar/Group 64.png',
    '/icons/Avatar/Group 65.png',
    '/icons/Avatar/Group 66.png',
    '/icons/Avatar/Group 67.png'
];

export const getAvatars = async (): Promise<string[]> => {
    if (cachedAvatars) return cachedAvatars;
    cachedAvatars = defaultAvatars;
    return defaultAvatars;
};

// Helper to get a random avatar that's different from recent ones
let lastUsedIndices: number[] = [];

export const getRandomAvatar = async (seed: string): Promise<string> => {
    const avatars = await getAvatars();
    const index = seed.split('').reduce((acc, char) => 
        acc + char.charCodeAt(0), 0) % avatars.length;
    return avatars[index];
}; 