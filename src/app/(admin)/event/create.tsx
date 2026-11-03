import { decode } from "base64-arraybuffer";
import { File } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
    Calendar,
    Clock,
    FileText,
    MapPin,
    Paperclip,
    X,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import EventQRCodeCard from "@/components/EventQRCodeCard";
import { supabase } from "@/lib/supabase";
import { createEvent } from "@/services/eventService";

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateTimeToISO = (dateStr: string, timeStr: string): string => {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    const d = new Date(`${dateStr}T${timeStr}`);
    if (isNaN(d.getTime()))
      throw new Error(`Invalid date/time format: ${dateStr} ${timeStr}`);
    return d.toISOString();
  }

  let [, hoursStr, minutesStr, period] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period.toUpperCase() === "PM" && hours < 12) {
    hours += 12;
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  const paddedHours = String(hours).padStart(2, "0");
  const paddedMinutes = String(minutes).padStart(2, "0");

  const isoDate = new Date(`${dateStr}T${paddedHours}:${paddedMinutes}:00`);
  if (isNaN(isoDate.getTime())) {
    throw new Error(`Invalid date values: ${dateStr} ${timeStr}`);
  }

  return isoDate.toISOString();
};

export default function CreateEventScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");

  // 1. Event Dates (Default to today)
  const today = getTodayDateString();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  // 2. Timeline Type (3 Options matching Web Admin)
  const [timelineType, setTimelineType] = useState<
    "time_in_only" | "in_out" | "in_breakout_breakin_out"
  >("in_out");

  // 3. Time Configuration (Matching Web Admin defaults)
  const [timeIn, setTimeIn] = useState("09:00 AM");
  const [timeOut, setTimeOut] = useState("05:00 PM");
  const [breakOut, setBreakOut] = useState("12:00 PM");
  const [breakIn, setBreakIn] = useState("01:00 PM");

  // Venue (Map button removed)
  const [venueAddress, setVenueAddress] = useState("");

  // Notice / Memo Attachment
  const [noticeImage, setNoticeImage] = useState<string | null>(null);

  const handlePickNoticeImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "You need to allow access to your photos to attach a notice or memo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setNoticeImage(result.assets[0].uri);
    }
  };

  const uploadNoticeAttachment = async (uri: string) => {
    const fileExt = uri.split(".").pop()?.toLowerCase() || "jpeg";
    const fileName = `notice_${Date.now()}.${fileExt}`;
    const filePath = `notices/${fileName}`;

    const file = new File(uri);
    const base64 = await file.base64();

    const { error: uploadError } = await supabase.storage
      .from("event-attachments")
      .upload(filePath, decode(base64), {
        contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("event-attachments")
      .getPublicUrl(filePath);

    return {
      file_name: fileName,
      file_url: publicUrlData.publicUrl,
    };
  };

  const handleSaveEvent = async () => {
    if (!title.trim()) {
      Alert.alert("Required Field", "Please enter an event title.");
      return;
    }

    if (!venueAddress.trim()) {
      Alert.alert("Required Field", "Please enter the venue address.");
      return;
    }

    setLoading(true);

    try {
      let attachments: { file_name: string; file_url: string }[] = [];
      if (noticeImage) {
        const uploadedFile = await uploadNoticeAttachment(noticeImage);
        attachments.push({
          file_name: uploadedFile.file_name,
          file_url: uploadedFile.file_url,
        });
      }

      const startIso = parseDateTimeToISO(startDate, timeIn);
      const endIso =
        timelineType === "time_in_only"
          ? startIso
          : parseDateTimeToISO(endDate, timeOut);

      const payload: any = {
        title,
        details,
        start_date: startIso,
        end_date: endIso,
        timeline_type: timelineType,
        venue: {
          address: venueAddress,
        },
        attachments,
      };

      if (timelineType === "in_breakout_breakin_out") {
        payload.break_out_date = parseDateTimeToISO(startDate, breakOut);
        payload.break_in_date = parseDateTimeToISO(startDate, breakIn);
      }

      await createEvent(payload);

      setLoading(false);
      Alert.alert(
        "Success",
        "Event created successfully with assigned QR Code!",
        [{ text: "OK", onPress: () => router.back() }],
      );
    } catch (error: any) {
      setLoading(false);
      console.error("Failed to create event:", error);
      Alert.alert("Error", error?.message || "Failed to create event.");
    }
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-6 pb-6 bg-white"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-extrabold text-brand-500 mb-4">
          Create Event
        </Text>

        {/* Basic Details */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Basic Details
        </Text>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-slate-700 mb-1.5">
            Event Title *
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
            <FileText size={18} color="#64748B" />
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Regional Leadership Summit"
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2.5 text-slate-900 font-medium text-base p-0"
            />
          </View>
        </View>

        <View className="mb-5">
          <Text className="text-sm font-semibold text-slate-700 mb-1.5">
            Details / Description
          </Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Write a brief overview of the event..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 font-medium text-base min-h-[90px]"
          />
        </View>

        {/* 1. Event Dates */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Event Dates
        </Text>
        <View className="flex-row gap-3 mb-5">
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-700 mb-1.5">
              Start Date
            </Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Calendar size={18} color="#64748B" />
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
              />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-700 mb-1.5">
              End Date
            </Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Calendar size={18} color="#64748B" />
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
              />
            </View>
          </View>
        </View>

        {/* 2. Timeline Type (Matching Web Admin: 3 Options) */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Timeline Type
        </Text>
        <View className="flex-row gap-2 mb-5">
          <TouchableOpacity
            onPress={() => setTimelineType("time_in_only")}
            className={`flex-1 p-3 rounded-xl border items-center justify-center ${
              timelineType === "time_in_only"
                ? "bg-brand-500 border-brand-500"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <Text
              className={`font-semibold text-xs text-center ${
                timelineType === "time_in_only"
                  ? "text-white"
                  : "text-slate-700"
              }`}
            >
              Time in only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTimelineType("in_out")}
            className={`flex-1 p-3 rounded-xl border items-center justify-center ${
              timelineType === "in_out"
                ? "bg-brand-500 border-brand-500"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <Text
              className={`font-semibold text-xs text-center ${
                timelineType === "in_out" ? "text-white" : "text-slate-700"
              }`}
            >
              Time in - out
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setTimelineType("in_breakout_breakin_out")}
            className={`flex-1 p-3 rounded-xl border items-center justify-center ${
              timelineType === "in_breakout_breakin_out"
                ? "bg-brand-500 border-brand-500"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <Text
              className={`font-semibold text-xs text-center ${
                timelineType === "in_breakout_breakin_out"
                  ? "text-white"
                  : "text-slate-700"
              }`}
            >
              With Breakouts
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Time Configuration (Conditional rendering 1:1 like Web Admin) */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Time Configuration
        </Text>

        {/* Mode A: Time In Only */}
        {timelineType === "time_in_only" && (
          <View className="mb-5">
            <Text className="text-sm font-semibold text-slate-700 mb-1.5">
              Time In
            </Text>
            <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
              <Clock size={18} color="#64748B" />
              <TextInput
                value={timeIn}
                onChangeText={setTimeIn}
                placeholder="09:00 AM"
                placeholderTextColor="#94A3B8"
                className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
              />
            </View>
          </View>
        )}

        {/* Mode B: In and Out */}
        {timelineType === "in_out" && (
          <View className="flex-row gap-3 mb-5">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                Time In
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <Clock size={18} color="#64748B" />
                <TextInput
                  value={timeIn}
                  onChangeText={setTimeIn}
                  placeholder="09:00 AM"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                Time Out
              </Text>
              <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                <Clock size={18} color="#64748B" />
                <TextInput
                  value={timeOut}
                  onChangeText={setTimeOut}
                  placeholder="05:00 PM"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
                />
              </View>
            </View>
          </View>
        )}

        {/* Mode C: With Breakouts (Time In, Break Out, Break In, Time Out) */}
        {timelineType === "in_breakout_breakin_out" && (
          <View className="gap-3 mb-5">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                  Time In
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                  <Clock size={18} color="#64748B" />
                  <TextInput
                    value={timeIn}
                    onChangeText={setTimeIn}
                    placeholder="08:00 AM"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                  Break Out
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                  <Clock size={18} color="#64748B" />
                  <TextInput
                    value={breakOut}
                    onChangeText={setBreakOut}
                    placeholder="12:00 PM"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
                  />
                </View>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                  Break In
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                  <Clock size={18} color="#64748B" />
                  <TextInput
                    value={breakIn}
                    onChangeText={setBreakIn}
                    placeholder="01:00 PM"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
                  />
                </View>
              </View>

              <View className="flex-1">
                <Text className="text-sm font-semibold text-slate-700 mb-1.5">
                  Time Out
                </Text>
                <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                  <Clock size={18} color="#64748B" />
                  <TextInput
                    value={timeOut}
                    onChangeText={setTimeOut}
                    placeholder="05:00 PM"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 ml-2 text-slate-900 font-medium text-sm p-0"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Venue Information (Map Button Removed) */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Venue Information
        </Text>

        <View className="mb-6">
          <Text className="text-sm font-semibold text-slate-700 mb-1.5">
            Venue Address *
          </Text>
          <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3">
            <MapPin size={18} color="#64748B" />
            <TextInput
              value={venueAddress}
              onChangeText={setVenueAddress}
              placeholder="Enter address..."
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2.5 text-slate-900 font-medium text-base p-0"
            />
          </View>
        </View>

        {/* Notice / Memo Image Attachment */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          Notice / Memo Attachment
        </Text>
        {noticeImage ? (
          <View className="relative mb-8 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-2">
            <Image
              source={{ uri: noticeImage }}
              className="w-full h-48 rounded-xl"
              resizeMode="contain"
            />
            <TouchableOpacity
              onPress={() => setNoticeImage(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-900/80 justify-center items-center"
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePickNoticeImage}
            className="w-full h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 justify-center items-center mb-8 flex-row gap-3"
          >
            <View className="w-10 h-10 rounded-full bg-slate-100 justify-center items-center">
              <Paperclip size={20} color="#64748B" />
            </View>
            <View>
              <Text className="text-sm font-semibold text-slate-700">
                Attach Official Notice / Memo
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Upload image scan or document screenshot
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Dynamic QR Code Preview Section */}
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
          Event QR Code Generation
        </Text>
        <EventQRCodeCard
          qrCode={
            title
              ? `EVT-PREVIEW-${title.replace(/\s+/g, "").toUpperCase()}`
              : "EVT-AUTO-GENERATED"
          }
          title="Generated Automatically on Creation"
          size={140}
        />

        {/* Action Buttons */}
        <View className="flex-col gap-2 mt-6">
          <TouchableOpacity
            activeOpacity={0.8}
            disabled={loading}
            onPress={handleSaveEvent}
            className="bg-brand-500 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-white font-bold text-base tracking-wide">
                Create Event
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            className="bg-red-400 py-4 rounded-2xl flex-row justify-center items-center shadow-sm"
          >
            <Text className="text-white font-bold text-base tracking-wide">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
