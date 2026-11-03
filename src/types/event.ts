import { CreateVenueInput, Venue } from "./venue";

export type TimelineType = "time_in_only" | "in_out" | "in_breakout_breakin_out";
export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface EventAttachment {
  id: string;
  event_id: string;
  file_name: string;
  file_url: string;
  size_bytes?: number;
  created_at?: string;
}

export interface Event {
  id: string;
  venue_id?: string;
  title: string;
  details?: string;
  start_date: string;
  end_date: string;
  break_out_date?: string;
  break_in_date?: string;
  timeline_type: TimelineType;
  qr_code: string;
  qr_image_url?: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;

  venue?: Venue;
  attachments?: EventAttachment[];
}

export interface CreateEventInput {
  title: string;
  details?: string;
  start_date: string;
  end_date: string;
  break_out_date?: string;
  break_in_date?: string;
  timeline_type: TimelineType;
  venue: CreateVenueInput;
  attachments?: { file_name: string; file_url: string; size_bytes?: number }[];
}

export interface UpdateEventInput extends Partial<CreateEventInput> {
  id: string;
  venue_id?: string;
}