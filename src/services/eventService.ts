import { supabase } from "@/lib/supabase";
import {
    Attendance,
    CreateEventInput,
    Event,
    UpdateEventInput,
} from "@/types";

/**
 * Fetch all events with their associated venue and attachments
 */
export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      venue:venues (*),
      attachments:event_attachments (*)
    `)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("Error fetching events:", error);
    throw error;
  }

  return data as Event[];
}

/**
 * Fetch a single event by ID with venue & attachments
 */
export async function getEventById(id: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from("events")
    .select(`
      *,
      venue:venues (*),
      attachments:event_attachments (*)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching event by id:", error);
    throw error;
  }

  return data as Event;
}

/**
 * Helper to generate and upload QR code image to Supabase Storage
 */
async function generateAndUploadQRCode(qrCode: string): Promise<string | undefined> {
  try {
    // Embed the web URL so phone camera apps open the link directly in the browser
    const checkInUrl = `https://epasweb.vercel.app/check-in/${qrCode}`;
    const qrApiUrl = `https://quickchart.io/qr?text=${encodeURIComponent(checkInUrl)}&size=300&margin=2`;

    const response = await fetch(qrApiUrl);
    if (!response.ok) throw new Error("Failed to generate QR image via API");

    const arrayBuffer = await response.arrayBuffer();
    const filePath = `qrcodes/${qrCode}.png`;

    const { error: uploadError } = await supabase.storage
      .from("event-attachments")
      .upload(filePath, arrayBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      console.error("Error uploading QR image to Supabase:", uploadError);
      return undefined;
    }

    const { data: publicUrlData } = supabase.storage
      .from("event-attachments")
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn("QR image creation failed, falling back to string identifier only:", err);
    return undefined;
  }
}

/**
 * Create a new Venue + Event + Attachments in order
 */
export async function createEvent(input: CreateEventInput): Promise<Event> {
  // 1. Insert Venue
  const { data: venueData, error: venueError } = await supabase
    .from("venues")
    .insert([
      {
        address: input.venue.address,
        latitude: input.venue.latitude,
        longitude: input.venue.longitude,
      },
    ])
    .select()
    .single();

  if (venueError) {
    console.error("Error creating venue:", venueError);
    throw venueError;
  }

  // 2. Generate unique QR Code identifier & image URL
  const qrCode = `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const qrImageUrl = await generateAndUploadQRCode(qrCode);

  // 3. Insert Event with Foreign Key to Venue & QR Code details
  const { data: eventData, error: eventError } = await supabase
    .from("events")
    .insert([
      {
        title: input.title,
        details: input.details,
        start_date: input.start_date,
        end_date: input.end_date,
        break_out_date: input.break_out_date,
        break_in_date: input.break_in_date,
        timeline_type: input.timeline_type,
        venue_id: venueData.id,
        qr_code: qrCode,
        qr_image_url: qrImageUrl,
        status: "upcoming",
      },
    ])
    .select()
    .single();

  if (eventError) {
    console.error("Error creating event:", eventError);
    throw eventError;
  }

  // 4. Insert Attachments if provided
  if (input.attachments && input.attachments.length > 0) {
    const attachmentRecords = input.attachments.map((att) => ({
      event_id: eventData.id,
      file_name: att.file_name,
      file_url: att.file_url,
      size_bytes: att.size_bytes,
    }));

    const { error: attachmentError } = await supabase
      .from("event_attachments")
      .insert(attachmentRecords);

    if (attachmentError) {
      console.error("Error adding attachments:", attachmentError);
    }
  }

  return getEventById(eventData.id) as Promise<Event>;
}

/**
 * Update Event and its Venue
 */
export async function updateEvent(input: UpdateEventInput): Promise<Event> {
  // 1. Update Venue if provided
  if (input.venue && input.venue_id) {
    const { error: venueError } = await supabase
      .from("venues")
      .update({
        address: input.venue.address,
        latitude: input.venue.latitude,
        longitude: input.venue.longitude,
      })
      .eq("id", input.venue_id);

    if (venueError) throw venueError;
  }

  // 2. Update Event details
  const { error: eventError } = await supabase
    .from("events")
    .update({
      title: input.title,
      details: input.details,
      start_date: input.start_date,
      end_date: input.end_date,
      break_out_date: input.break_out_date,
      break_in_date: input.break_in_date,
      timeline_type: input.timeline_type,
    })
    .eq("id", input.id);

  if (eventError) throw eventError;

  // 3. Handle Attachments (Clear old ones and insert new ones if provided)
  if (input.attachments) {
    const { error: deleteError } = await supabase
      .from("event_attachments")
      .delete()
      .eq("event_id", input.id);

    if (deleteError) {
      console.error("Error clearing old attachments:", deleteError);
    }

    if (input.attachments.length > 0) {
      const attachmentRecords = input.attachments.map((att) => ({
        event_id: input.id,
        file_name: att.file_name,
        file_url: att.file_url,
        size_bytes: att.size_bytes ?? 0,
      }));

      const { error: insertError } = await supabase
        .from("event_attachments")
        .insert(attachmentRecords);

      if (insertError) {
        console.error("Error adding new attachments:", insertError);
      }
    }
  }

  return getEventById(input.id) as Promise<Event>;
}

/**
 * Delete Event
 */
export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

/**
 * Fetch attendance logs for a specific event
 */
export async function getEventAttendances(eventId: string): Promise<Attendance[]> {
  const { data, error } = await supabase
    .from("attendances")
    .select(`
      *,
      profile:users (*)
    `)
    .eq("event_id", eventId)
    .order("scanned_at", { ascending: false });

  if (error) {
    console.error("Error fetching attendances:", error);
    throw error;
  }

  return data as Attendance[];
}