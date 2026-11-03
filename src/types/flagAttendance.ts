import { UserProfile } from './user';

export interface FlagAttendance {
  id: string;
  client_id: string;
  code: string;
  ceremony_type: string;
  status: string; 
  scan_date: string;
  scan_time: string;
  created_at: string;
  user?: UserProfile;
}

export interface CreateFlagAttendanceDTO {
  client_id: string;
  code: string;
  ceremony_type: string;
  status: string;
  scan_date?: string;
  scan_time?: string;
}