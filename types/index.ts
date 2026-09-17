export interface UserProfile {
  id: string;
  full_name: string;
  role: string;
  is_approved: boolean;
  email?: string;
}

export interface DonationItem {
  id: string;
  title: string;
  category: string;
  sub_category?: string;
  condition?: string;
  description?: string;
  location: string;
  image_url?: string;
  donor_id?: string;
  volunteer_id?: string;
  status: string;
  target_need_id?: string | null;
}

export interface NeedRequest {
  id: string;
  title: string;
  category: string;
  sub_category?: string;
  urgency: string;
  description?: string;
  beneficiary_id?: string;
  status: string;
  quantity?: number;
  delivery_address: string;
  delivery_location: string;
  contact_phone: string;
}
/**
 * A donation row joined with the delivery details copied from the need it targets.
 * These columns are absent on untargeted donations, hence all optional.
 */
export interface DeliverableDonation extends DonationItem {
  delivery_address?: string | null;
  delivery_location?: string | null;
  contact_phone?: string | null;
  beneficiary_id?: string | null;
}

/**
 * An alert raised when a newly published donation matched an open need.
 * `donation` and `need` are joined in by the query rather than stored, so the
 * card always reflects the item's current title and status — a donation that
 * was reserved by someone else in the meantime still reads correctly.
 */
export interface MatchNotification {
  id: string;
  need_id: string;
  donation_id: string;
  score: number;
  read_at: string | null;
  created_at: string;
  donation?: {
    title: string;
    image_url?: string | null;
    condition?: string | null;
    location?: string | null;
    status: string;
  } | null;
  need?: { title: string } | null;
}

/* ---------------- Dashboard form shapes ---------------- */

export interface NewUserForm {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface NewItemForm {
  title: string;
  category: string;
  sub_category: string;
  location: string;
  condition: string;
  description: string;
  volunteer_id: string;
}

export interface NewNeedForm {
  title: string;
  category: string;
  sub_category: string;
  urgency: string;
  description: string;
  quantity: number;
  delivery_address: string;
  delivery_location: string;
  contact_phone: string;
}

export interface DonorItemForm {
  title: string;
  category: string;
  sub_category: string;
  condition: string;
  description: string;
  location: string;
  target_need_id: string | null;
}
