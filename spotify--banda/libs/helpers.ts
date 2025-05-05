import { Price } from "@/types";

// Utility function to get the base URL
export const getURL = () => {
  let url = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_VERCEL_URL ?? 'http://localhost:3000';

  url = url.includes('http') ? url : `https://${url}`; // Make sure the protocol is set correctly
  url = url.endsWith('/') ? url : `${url}/`; // Ensure the URL ends with a slash

  return url;
}

// Function to send a POST request
export const postData = async ({ url, data }: { url: string, data?: { price: Price } }) => {
  console.log("POST REQUEST", url, data);

  const res: Response = await fetch(url, {
    method: "POST",
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    console.log('Error in POST', { url, data, res });
    throw new Error(res.statusText);
  }

  return res.json();
}

// Convert seconds to DateTime
export const toDateTime = (secs: number) => {
  // Ensure to avoid the local timezone issues. The `t` can be created with any fixed time in UTC, such as 1970-01-01T00:30:00Z
  let t = new Date('1970-01-01T00:30:00Z');
  t.setSeconds(secs); // Set the seconds from the given seconds count
  return t;
}
