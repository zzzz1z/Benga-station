import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const getUsersEmail = async (): Promise<string[]> => {
    const supabase = createServerComponentClient({
        cookies: cookies,
    });

    // Fetching all users' emails from the auth.users table
    const { data, error } = await supabase.from('users').select('email');

    if (error) {
        console.error("Error fetching emails:", error);
        return [];
    }
    
    console.log(data)

    // Extracting only the emails and returning them as an array
    return data?.map((user: { email: string }) => user.email) ?? [];
    
};

export default getUsersEmail;
