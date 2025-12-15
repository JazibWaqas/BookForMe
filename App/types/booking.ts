/**
 * Booking-related TypeScript types
 */

export type SlotStatus =
    | 'available'
    | 'locked'
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'blocked';

export interface SlotDetails {
    id: string;
    slot_id?: string;
    vendor_id: string;
    service_id: string;
    service_name?: string;
    resource_id: string;
    resource_name?: string;
    date: string;
    start_time: string; // ISO timestamp
    end_time: string; // ISO timestamp
    price: number;
    price_tier_used?: string;
    status: SlotStatus;
    user_id?: string;
    booking_source?: string;
    payment_id?: string;
    hold_expires_at?: string; // ISO timestamp
    created_at?: string;
    updated_at?: string;
}

export interface ResourceGroup {
    resource_id: string;
    resource_name: string;
    service_id: string;
    service_name: string;
    slots: SlotDetails[];
    availableCount: number;
}

export interface AvailabilitySlotsResponse {
    success: boolean;
    vendor_id: string;
    date: string;
    available_slots?: SlotDetails[];
    resources?: ResourceGroup[];
    error?: string;
}

export interface LockSlotResponse {
    success: boolean;
    slot_id?: string;
    user_id?: string;
    booking_source?: string;
    hold_expires_at?: string; // ISO timestamp
    expires_in_minutes?: number;
    error?: string;
}

export interface LockedSlot {
    slot_id: string;
    vendor_id: string;
    vendor_name: string;
    resource_name: string;
    service_name: string;
    date: string;
    start_time: string;
    end_time: string;
    price: number;
    hold_expires_at: string; // ISO timestamp
    locked_at: string; // ISO timestamp
}

export interface ReleaseSlotResponse {
    success: boolean;
    slot_id?: string;
    error?: string;
}

export interface PaymentSubmissionData {
    slot_id: string;
    screenshot_url: string;
    amount_claimed: number;
}

export interface PaymentSubmissionResponse {
    success: boolean;
    payment_id?: string;
    slot_id?: string;
    status?: string;
    message?: string;
    error?: string;
}
