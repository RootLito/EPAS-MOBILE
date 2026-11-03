// src/types/attendance.ts
import { Event } from "./event";
import { UserProfile } from "./user";

export type AttendanceScanType =
  | "time_in"
  | "break_out"
  | "break_in"
  | "time_out";

export type ParticipantCategory = "bfar" | "non_bfar";

/* =========================================================
   BFAR Types
========================================================= */

export interface Attendance {
  id: string;
  event_id: string;
  user_id: string;
  scan_type: AttendanceScanType;
  scanned_at: string;
  selfie_url?: string | null;

  profile?: UserProfile;
  event?: Event;
}

export interface AttendanceSummaryRow {
  key: string;
  user_id: string;
  event_id: string;
  event_title: string;
  fullname: string;
  scanned_date: string;
  time_in?: string;
  break_out?: string;
  break_in?: string;
  time_out?: string;
}

/* =========================================================
   Non-BFAR Types 
========================================================= */

export interface NonBfarAttendee {
  id: string;
  event_id: string;
  full_name: string;
  organization: string;
  email?: string | null;
  contact_number?: string | null;
  selfie_url?: string | null;
  break_out_selfie_url?: string | null;
  break_in_selfie_url?: string | null;
  checked_out_selfie_url?: string | null;
  checked_in_at: string;
  break_out_at?: string | null;
  break_in_at?: string | null;
  checked_out_at?: string | null;
}

/* =========================================================
   Unified Table View Row
========================================================= */

export interface AttendanceRow {
  userId: string;
  name: string;
  office: string;
  time_in: string | null;
  break_out: string | null;
  break_in: string | null;
  time_out: string | null;
  firstScanTime: string | null;

  // Individual photo properties for each scan slot
  time_in_photo?: string | null;
  break_out_photo?: string | null;
  break_in_photo?: string | null;
  time_out_photo?: string | null;
}