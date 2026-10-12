import { supabase } from "@/lib/supabase";
import { Attendance } from "@/types/attendance";
import { Event } from "@/types/event";

export const attendanceService = {
  /**
   * Fetch all events sorted by latest start date
   */
  async getEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching events:", error.message);
      throw error;
    }

    return data || [];
  },

  /**
   * Fetch attendance records joining 'users' and 'events' tables
   */
  async getAttendanceLogs(selectedEventId?: string): Promise<Attendance[]> {
    let query = supabase
      .from("attendances")
      .select(`
        id,
        event_id,
        user_id,
        scan_type,
        scanned_at,
        profile:users!user_id (
          id,
          code,
          fullname,
          position,
          office,
          role,
          avatar_url
        ),
        event:events!event_id (
          id,
          title
        )
      `)
      .order("scanned_at", { ascending: false });

    if (selectedEventId) {
      query = query.eq("event_id", selectedEventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching attendance records:", error.message);
      throw error;
    }

    return (data as unknown as Attendance[]) || [];
  },


  /**
   * Fetch attendance logs specifically for a given user ID across all events or a selected event
   */
  async getUserAttendanceLogs(
    userId: string,
    selectedEventId?: string
  ): Promise<Attendance[]> {
    let query = supabase
      .from("attendances")
      .select(`
        id,
        event_id,
        user_id,
        scan_type,
        scanned_at,
        profile:users!user_id (
          id,
          code,
          fullname,
          position,
          office,
          role,
          avatar_url
        ),
        event:events!event_id (
          id,
          title
        )
      `)
      .eq("user_id", userId)
      .order("scanned_at", { ascending: false });

    if (selectedEventId) {
      query = query.eq("event_id", selectedEventId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching user attendance records:", error.message);
      throw error;
    }

    return (data as unknown as Attendance[]) || [];
  },
};