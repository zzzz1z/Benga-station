// pages/api/createUser.ts

import { supabaseAdmin } from '@/libs/supabaseAdmin'; // Adjust the path if needed
import { NextApiRequest, NextApiResponse } from 'next';

const createUser = async (req: NextApiRequest, res: NextApiResponse) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { id, email, created_at } = req.body;

    // Validate input data
    if (!id || !email || !created_at) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Insert user data into Supabase users table
        const { error } = await supabaseAdmin.from('users').upsert([
            {
                id,
                email,
                created_at,
            },
        ]);

        if (error) {
            console.error('Error inserting user:', error);
            return res.status(500).json({ message: 'Error inserting user into database' });
        }

        // Respond with success
        res.status(200).json({ message: 'User created/updated successfully' });
    } catch (error) {
        console.error('Error in createUser API route:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

export default createUser;
