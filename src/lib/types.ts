// ---------------------------------------------------------------------------
// Auto Dude Command Center — domain types. Row shapes use snake_case to match
// Supabase columns directly (no mapping layer), keeping the many-table MVP simple.
// ---------------------------------------------------------------------------

// ============================ Job status workflow ============================
export type JobStatus =
  | "Draft"
  | "Pending Confirmation"
  | "Confirmed"
  | "Scheduled"
  | "Technician Assigned"
  | "En Route"
  | "Checked In"
  | "In Progress"
  | "Waiting"
  | "Completed"
  | "Cancelled"
  | "Rescheduled"
  | "No Show";

export const JOB_STATUSES: JobStatus[] = [
  "Draft", "Pending Confirmation", "Confirmed", "Scheduled", "Technician Assigned",
  "En Route", "Checked In", "In Progress", "Waiting", "Completed",
  "Cancelled", "Rescheduled", "No Show",
];

/** The linear "happy path" a job travels, for progress + next-status logic. */
export const JOB_FLOW: JobStatus[] = [
  "Draft", "Pending Confirmation", "Confirmed", "Scheduled", "Technician Assigned",
  "En Route", "Checked In", "In Progress", "Completed",
];

/** Statuses a technician is allowed to set themselves (field actions only). */
export const TECH_SETTABLE_STATUSES: JobStatus[] = [
  "En Route", "Checked In", "In Progress", "Waiting", "Completed",
];

export type StatusTone = "neutral" | "info" | "warn" | "active" | "good" | "danger";
export const STATUS_TONE: Record<JobStatus, StatusTone> = {
  Draft: "neutral",
  "Pending Confirmation": "warn",
  Confirmed: "info",
  Scheduled: "info",
  "Technician Assigned": "info",
  "En Route": "active",
  "Checked In": "active",
  "In Progress": "active",
  Waiting: "warn",
  Completed: "good",
  Cancelled: "danger",
  Rescheduled: "warn",
  "No Show": "danger",
};

export type PaymentStatus = "Unpaid" | "Deposit Paid" | "Partially Paid" | "Paid" | "Refunded";
export const PAYMENT_STATUSES: PaymentStatus[] = ["Unpaid", "Deposit Paid", "Partially Paid", "Paid", "Refunded"];

export type ServiceItemStatus = "Not Started" | "In Progress" | "Completed" | "Skipped";
export const SERVICE_ITEM_STATUSES: ServiceItemStatus[] = ["Not Started", "In Progress", "Completed", "Skipped"];

export type ChecklistItemStatus = "Not Started" | "In Progress" | "Completed" | "Skipped";

export type PhotoType = "before" | "after" | "damage" | "profile";
export type InspectionType = "pre_service" | "post_service";
export type TimeEntryType = "en_route" | "check_in" | "start" | "pause" | "resume" | "complete";
export type AssignmentRole = "primary" | "assist";

// ============================ Table row types ============================
export interface Technician {
  id: string;
  profile_id: string | null;
  employee_code: string;
  skills: string[];
  service_areas: string[];
  default_start_location: string;
  employment_status: string; // Active | Inactive | On Leave
  hourly_rate: number;
  commission_rate: number;
  created_at?: string;
  updated_at?: string;
  // joined
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
}

export interface TechnicianAvailability {
  id: string;
  technician_id: string;
  day_of_week: number; // 0=Sun..6=Sat
  available_start: string; // HH:MM
  available_end: string;   // HH:MM
  is_available: boolean;
  effective_date: string | null;
  end_date: string | null;
  created_at?: string;
}

export interface Customer {
  id: string;
  ghl_contact_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  secondary_phone: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  customer_notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface Vehicle {
  id: string;
  customer_id: string;
  year: number | null;
  make: string;
  model: string;
  trim: string;
  color: string;
  size_category: string;
  license_plate: string;
  vin: string;
  vehicle_notes: string;
  created_at?: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  ghl_product_id: string | null;
  name: string;
  slug: string;
  description: string;
  category: string;
  default_duration_minutes: number;
  base_price: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceChecklistTemplate {
  id: string;
  service_id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at?: string;
}

export interface ServiceChecklistTemplateItem {
  id: string;
  template_id: string;
  title: string;
  description: string;
  sort_order: number;
  is_required: boolean;
  requires_photo: boolean;
  created_at?: string;
}

export interface Job {
  id: string;
  job_number: string;
  ghl_appointment_id: string | null;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  customer_id: string | null;
  vehicle_id: string | null;
  service_address: string;
  city: string;
  state: string;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  arrival_window_start: string | null;
  arrival_window_end: string | null;
  estimated_duration_minutes: number;
  status: JobStatus;
  payment_status: PaymentStatus;
  invoice_total: number;
  deposit_amount: number;
  remaining_balance: number;
  customer_notes: string;
  internal_notes: string;
  access_instructions: string;
  assigned_vehicle: string;
  sync_status: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  archived_at?: string | null;
}

/** Job with joined customer/vehicle/assignments for list & detail views. */
export interface JobExpanded extends Job {
  customer?: Customer | null;
  vehicle?: Vehicle | null;
  assignments?: JobAssignment[];
  service_items?: JobServiceItem[];
  primary_technician?: Technician | null;
}

export interface JobAssignment {
  id: string;
  job_id: string;
  technician_id: string;
  assignment_role: AssignmentRole;
  assigned_start: string | null;
  assigned_end: string | null;
  is_primary: boolean;
  assigned_at?: string;
  assigned_by: string | null;
  // joined
  technician?: Technician | null;
}

export interface JobServiceItem {
  id: string;
  job_id: string;
  service_id: string | null;
  assigned_technician_id: string | null;
  service_name_snapshot: string;
  description_snapshot: string;
  price_snapshot: number;
  estimated_duration_minutes: number;
  status: ServiceItemStatus;
  sort_order: number;
  started_at: string | null;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobChecklistItem {
  id: string;
  job_service_item_id: string;
  template_item_id: string | null;
  title_snapshot: string;
  description_snapshot: string;
  is_required: boolean;
  requires_photo: boolean;
  status: ChecklistItemStatus;
  technician_note: string;
  completed_by: string | null;
  completed_at: string | null;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface JobStatusHistory {
  id: string;
  job_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  change_source: string; // admin | technician | webhook | system
  note: string;
  created_at?: string;
  // joined
  changed_by_name?: string;
}

export interface JobTimeEntry {
  id: string;
  job_id: string;
  technician_id: string | null;
  entry_type: TimeEntryType;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  latitude: number | null;
  longitude: number | null;
  note: string;
  created_at?: string;
}

export interface JobPhoto {
  id: string;
  job_id: string;
  job_service_item_id: string | null;
  uploaded_by: string | null;
  photo_type: PhotoType;
  storage_path: string;
  caption: string;
  taken_at: string | null;
  created_at?: string;
  // resolved at read time
  signed_url?: string;
}

export interface JobInspection {
  id: string;
  job_id: string;
  inspection_type: InspectionType;
  completed_by: string | null;
  condition_summary: string;
  damage_notes: string;
  customer_concerns: string;
  recommendations: string;
  latitude: number | null;
  longitude: number | null;
  completed_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceClient {
  id: string;
  customer_id: string;
  vehicle_id: string | null;
  program_name: string;
  frequency: string; // Monthly | Bi-Monthly | Quarterly
  status: string;     // Active | Paused | Past Due | Cancelled | Needs Scheduling
  start_date: string | null;
  next_service_date: string | null;
  last_service_date: string | null;
  preferred_day: string;
  preferred_time: string;
  assigned_technician_id: string | null;
  monthly_value: number;
  ghl_subscription_id: string | null;
  notes: string;
  created_at?: string;
  updated_at?: string;
  // joined
  customer?: Customer | null;
  vehicle?: Vehicle | null;
  technician?: Technician | null;
}

export interface Lead {
  id: string;
  ghl_contact_id: string | null;
  ghl_opportunity_id: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  source: string;
  campaign: string;
  service_interest: string;
  pipeline_stage: string;
  lead_status: string; // New | Contacted | Qualified | Booked | Lost
  estimated_value: number;
  created_at?: string;
  updated_at?: string;
}

export interface MarketingMetric {
  id: string;
  metric_date: string;
  platform: string;
  campaign_name: string;
  ad_spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  booked_jobs: number;
  revenue: number;
  created_at?: string;
  updated_at?: string;
}

export interface WebhookEvent {
  id: string;
  source: string;
  event_type: string;
  external_event_id: string | null;
  payload: unknown;
  processing_status: string; // received | processed | duplicate | invalid | unauthorized | error
  error_message: string;
  received_at?: string;
  processed_at?: string | null;
}

export interface ActivityLog {
  id: string;
  actor_profile_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  old_data: unknown;
  new_data: unknown;
  created_at?: string;
  // joined
  actor_name?: string;
}

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Booked", "Lost"] as const;
export const LEAD_SOURCES = ["Meta Ads", "Google Ads", "Google Business Profile", "Organic Social", "Referral", "Direct", "Other"] as const;
export const MARKETING_PLATFORMS = ["Meta Ads", "Google Ads", "Google Business Profile", "Organic Social", "Referral", "Direct", "Other"] as const;
export const MAINTENANCE_STATUSES = ["Active", "Paused", "Past Due", "Cancelled", "Needs Scheduling"] as const;
export const VEHICLE_SIZES = ["Coupe/Compact", "Sedan", "Truck", "Mid-Size SUV", "Large SUV", "Oversized/Specialty"] as const;
export const SERVICE_AREAS = [
  "New Braunfels", "Bulverde", "Spring Branch", "Canyon Lake", "Wimberley",
  "Boerne", "Dripping Springs", "San Marcos", "Seguin",
] as const;
