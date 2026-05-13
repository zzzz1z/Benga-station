import Stripe from "stripe";

export interface UserDetails {
    readonly id: string;
    first_name: string;
    last_name: string;
    phone: string;
    role: string;
    email: string;
    full_name: string;
    avatar_url?: string;
    billing_address?: Stripe.Address;
    payment_method?: Stripe.PaymentMethod | null;
}

export interface ProductWithPrice extends Product {
    prices?: Price[];
}

export interface Song {
    readonly id: string;
    user_id: string;
    author: string;
    title: string;
    song_path: string;
    image_path: string;
    source?: 'supabase' | 'youtube';
    youtube_video_id?: string;
}

export interface Playlist {
    readonly id: string;
    user_id: string;
    description?: string;
    title: string;
    created_at: string;
    songs: Song[]; // always populated by getPlaylists, empty array as fallback
    cover_image?: string;
}

export interface Product {
    readonly id: string;
    active?: boolean;
    name?: string;
    description?: string;
    image?: string;
    metadata?: Stripe.Metadata;
}

export interface Price {
    readonly id: string;
    product_id?: string;
    active?: boolean;
    description?: string;
    unit_amount?: number;
    currency?: string;
    type?: Stripe.Price.Type;
    interval?: Stripe.Price.Recurring.Interval;
    interval_count?: number;
    trial_period_days?: number | null;
    metadata?: Stripe.Metadata;
    products?: Product;
}

export interface Subscription {
    readonly id: string;
    user_id: string;
    status?: Stripe.Subscription.Status;
    metadata?: Stripe.Metadata;
    price_id?: string;
    quantity?: number;
    cancel_at_period_start?: string;
    current_period_end: string;
    ended_at?: string;
    cancel_at?: string;
    canceled_at?: string;
    trial_start?: string;
    trial_end?: string;
    prices?: Price;
}