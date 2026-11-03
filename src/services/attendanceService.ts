// services/attendanceService.ts (React Native)
import { supabase } from "@/lib/supabase";
import { Attendance, AttendanceScanType, NonBfarAttendee } from "@/types/attendance";
import { Event } from "@/types/event";
import { decode } from "base64-arraybuffer";

const STORAGE_BUCKET = "event-attachments";

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

    return (data as Event[]) || [];
  },

  /**
   * Upload selfie photo to "event-attachments/selfies"
   */
  async uploadSelfie(
    eventId: string,
    userId: string,
    scanType: AttendanceScanType,
    base64Data: string
  ): Promise<string> {
    try {
      const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `${userId}_${scanType}_${Date.now()}.jpg`;
      const filePath = `selfies/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, decode(cleanBase64), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        console.error("Storage upload error details:", uploadError);
        throw new Error(uploadError.message || "Failed to upload selfie photo.");
      }

      const { data: publicUrlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePath);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      console.error("uploadSelfie caught error:", err);
      throw err;
    }
  },

  /**
   * Check if user already scanned for this type
   */
  async checkUserScanExists(
    eventId: string,
    userId: string,
    scanType: AttendanceScanType
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("attendances")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .eq("scan_type", scanType)
      .maybeSingle();

    if (error) {
      console.error("Error checking scan:", error.message);
      throw error;
    }

    return !!data;
  },

  /**
   * Record attendance and link the selfie URL
   */
  async recordAttendance(params: {
    eventId: string;
    userId: string;
    scanType: AttendanceScanType;
    base64Photo?: string;
  }): Promise<void> {
    const { eventId, userId, scanType, base64Photo } = params;

    let selfieUrl: string | null = null;

    if (base64Photo) {
      selfieUrl = await this.uploadSelfie(eventId, userId, scanType, base64Photo);
    }

    const { error } = await supabase.from("attendances").insert([
      {
        event_id: eventId,
        user_id: userId,
        scan_type: scanType,
        scanned_at: new Date().toISOString(),
        selfie_url: selfieUrl,
      },
    ]);

    if (error) {
      if (error.code === "23505") {
        throw new Error(
          `You have already recorded ${scanType.replace("_", " ")} for this event.`
        );
      }
      throw error;
    }
  },

  /**
   * Fetch attendance logs for BFAR employees
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
        selfie_url,
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
    if (error) throw error;
    return (data as unknown as Attendance[]) || [];
  },

  /**
   * Fetch Non-BFAR attendees for an event
   */
  async getNonBfarAttendances(selectedEventId?: string): Promise<NonBfarAttendee[]> {
    let query = supabase
      .from("non_bfar_attendees")
      .select("*")
      .order("checked_in_at", { ascending: false });

    if (selectedEventId) {
      query = query.eq("event_id", selectedEventId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error fetching non-BFAR attendees:", error.message);
      throw error;
    }
    return (data as NonBfarAttendee[]) || [];
  },

  /**
   * Fetch attendance logs for a specific user
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
        selfie_url,
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
    if (error) throw error;
    return (data as unknown as Attendance[]) || [];
  },
};