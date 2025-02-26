import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const avatarPath = path.join(process.cwd(), 'public', 'icons', 'Avatar');
        const files = await fs.promises.readdir(avatarPath);

        const avatars = files
            .filter(file => /\.(png|jpg|jpeg|svg)$/i.test(file))
            .map(file => `/icons/Avatar/${file}`);

        res.status(200).json(avatars);
    } catch (error) {
        res.status(500).json({ error: 'Failed to load avatars' });
    }
}
