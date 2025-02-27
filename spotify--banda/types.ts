import { JSX } from "react";
import Stripe from "stripe";

export interface UserDetails {
    readonly id: string;
    first_name: string;
    last_name: string;
    full_name: string;
    avatar_url?: string; // Optional, users may not have an avatar
    billing_address?: Stripe.Address; // Optional, billing address may not be provided
    payment_method?: Stripe.PaymentMethod | null; // Payment method or null
}

export interface ProductWithPrice extends Product {
    prices?: Price[]; // Optional array of prices
}

export interface Song {
    readonly id: string;
    user_id: string;
    author: string;
    title: string;
    song_path: string; // Path or URL to the song file
    image_path: string; // Path or URL to the song's image
}

export interface Playlist {
    readonly id: string;
    user_id: string;
    description: string;
    author: string;
    title: string;
    created_at: string; // ISO string of creation time
    songs: Song[]; // Array of songs in the playlist
    cover_image: string; // Path or URL to the playlist's cover image
}

export interface Product {
    readonly id: string;
    active?: boolean;
    name?: string;
    description?: string;
    image?: string; // Path or URL to product image
    metadata?: Stripe.Metadata;
}

export interface Price {
    readonly id: string;
    product_id?: string;
    active?: boolean;
    description?: string;
    unit_amount?: number; // Price amount in cents
    currency?: string; // ISO 4217 currency code (e.g., USD)
    type?: Stripe.Price.Type; // One-time or recurring
    interval?: Stripe.Price.Recurring.Interval; // Billing interval (e.g., "month")
    interval_count?: number; // Number of intervals between bills
    trial_period_days?: number | null; // Optional trial period in days
    metadata?: Stripe.Metadata;
    products?: Product; // Associated product
}

export interface Subscription {
    readonly id: string;
    user_id: string;
    status?: Stripe.Subscription.Status; // Subscription status
    metadata?: Stripe.Metadata; // Additional metadata
    price_id?: string; // Price ID
    quantity?: number; // Quantity of subscription items
    cancel_at_period_start?: string; // ISO date when cancellation starts
    current_period_end: string; // ISO date for current period end
    ended_at?: string; // ISO date when subscription ended
    cancel_at?: string; // ISO date for scheduled cancellation
    canceled_at?: string; // ISO date when canceled
    trial_start?: string; // ISO date for trial start
    trial_end?: string; // ISO date for trial end
    prices?: Price; // Associated price
}
