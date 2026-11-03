// app/(admin)/attendance.tsx
import { Calendar, ChevronDown, Search, UserCheck } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { AdminAttendanceRow } from "@/components/admin/AdminAttendanceRow";
import { AdminPhotoModal } from "@/components/admin/AdminPhotoModal";
import { attendanceService } from "@/services/attendanceService";
import { AttendanceRow } from "@/types/attendance";
import { Event } from "@/types/event";

export default function AttendanceScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [participantType, setParticipantType] = useState<"bfar" | "non_bfar">(
    "bfar",
  );

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Raw logs data
  const [bfarLogs, setBfarLogs] = useState<any[]>([]);
  const [nonBfarLogs, setNonBfarLogs] = useState<any[]>([]);

  // Selected photo for modal
  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string | null;
    name: string;
    org: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [fetchedEvents, bfarData, nonBfarData] = await Promise.all([
        attendanceService.getEvents(),
        attendanceService.getAttendanceLogs(selectedEvent?.id),
        attendanceService.getNonBfarAttendances(selectedEvent?.id),
      ]);

      setEvents(fetchedEvents);
      setBfarLogs(bfarData);
      setNonBfarLogs(nonBfarData);
    } catch (err) {
      console.error("Failed to load attendance data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedEvent]);

  // Transform data into unified AttendanceRow structure (matches Web Admin)
  const attendanceRows = useMemo<AttendanceRow[]>(() => {
    let rows: AttendanceRow[] = [];

    if (participantType === "bfar") {
      const userMap: Record<string, any> = {};

      bfarLogs.forEach((item) => {
        const uid = item.user_id;
        const profile = item.profile || item.users;

        if (!userMap[uid]) {
          userMap[uid] = {
            userId: uid,
            name: profile?.fullname || "Unknown User",
            office: profile?.office || "—",
            time_in: null,
            break_out: null,
            break_in: null,
            time_out: null,
            firstScanTime: null,
            time_in_photo: null,
            break_out_photo: null,
            break_in_photo: null,
            time_out_photo: null,
          };
        }

        if (item.scan_type && item.scanned_at) {
          userMap[uid][item.scan_type] = item.scanned_at;

          if (item.selfie_url) {
            userMap[uid][`${item.scan_type}_photo`] = item.selfie_url;
          }

          if (
            !userMap[uid].firstScanTime ||
            new Date(item.scanned_at) < new Date(userMap[uid].firstScanTime)
          ) {
            userMap[uid].firstScanTime = item.scanned_at;
          }
        }
      });

      rows = Object.values(userMap);
    } else {
      // Non-BFAR Attendees
      rows = nonBfarLogs.map((att) => ({
        userId: att.id,
        name: att.full_name || "Unknown Guest",
        office: att.organization || "—",
        time_in: att.checked_in_at || null,
        break_out: att.break_out_at || null,
        break_in: att.break_in_at || null,
        time_out: att.checked_out_at || null,
        firstScanTime: att.checked_in_at || null,
        time_in_photo: att.selfie_url || null,
        break_out_photo: att.break_out_selfie_url || null,
        break_in_photo: att.break_in_selfie_url || null,
        time_out_photo: att.checked_out_selfie_url || null,
      }));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.office.toLowerCase().includes(q),
      );
    }

    return rows;
  }, [participantType, bfarLogs, nonBfarLogs, searchQuery]);

  return (
    <View className="flex-1 px-6 bg-white">
      {/* 1. Page Header */}
      <Text className="text-3xl font-extrabold text-brand-500 mb-4 tracking-tight mt-2">
        Event Attendance
      </Text>

      {/* 2. Participant Category Tabs */}
      <View className="flex-row gap-2 mb-3">
        <TouchableOpacity
          onPress={() => setParticipantType("bfar")}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center border ${
            participantType === "bfar"
              ? "bg-brand-500 border-brand-500"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              participantType === "bfar" ? "text-white" : "text-slate-600"
            }`}
          >
            BFAR Personnel
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setParticipantType("non_bfar")}
          className={`flex-1 py-2.5 rounded-xl items-center justify-center border ${
            participantType === "non_bfar"
              ? "bg-brand-500 border-brand-500"
              : "bg-slate-50 border-slate-200"
          }`}
        >
          <Text
            className={`font-bold text-xs ${
              participantType === "non_bfar" ? "text-white" : "text-slate-600"
            }`}
          >
            Non-BFAR Guests
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Search Bar */}
      <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-3 border border-slate-200/50">
        <Search size={18} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={
            participantType === "bfar"
              ? "Search by Name or Office..."
              : "Search by Name or Organization..."
          }
          placeholderTextColor="#94A3B8"
          className="flex-1 ml-3 text-sm text-slate-800 font-medium p-0"
        />
      </View>

      {/* 4. Event Filter Dropdown */}
      <View className="z-20 mb-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex-row items-center justify-between bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200/50"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <Calendar size={18} color="#395886" />
            <Text
              className="ml-2.5 text-sm font-semibold text-slate-700"
              numberOfLines={1}
            >
              {selectedEvent ? selectedEvent.title : "All Events"}
            </Text>
          </View>
          <ChevronDown size={18} color="#64748B" />
        </TouchableOpacity>

        {isDropdownOpen && (
          <View className="absolute top-14 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-lg max-h-52 z-30 overflow-hidden">
            <ScrollView nestedScrollEnabled>
              <TouchableOpacity
                onPress={() => {
                  setSelectedEvent(null);
                  setIsDropdownOpen(false);
                }}
                className={`px-4 py-3 border-b border-slate-100 ${
                  selectedEvent === null ? "bg-slate-50" : ""
                }`}
              >
                <Text className="font-bold text-slate-800">All Events</Text>
              </TouchableOpacity>

              {events.map((ev) => (
                <TouchableOpacity
                  key={ev.id}
                  onPress={() => {
                    setSelectedEvent(ev);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-3 border-b border-slate-100 ${
                    selectedEvent?.id === ev.id ? "bg-slate-50" : ""
                  }`}
                >
                  <Text
                    className="font-medium text-slate-700"
                    numberOfLines={1}
                  >
                    {ev.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 5. Attendance Matrix Table */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#395886" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          className="flex-1"
        >
          <View>
            {/* Header Columns */}
            <View className="flex-row bg-slate-100 py-3 px-2 rounded-xl border border-slate-200/60 mb-2">
              <Text className="w-48 font-bold text-slate-700 text-xs">
                {participantType === "bfar"
                  ? "Participant & Office"
                  : "Guest & Organization"}
              </Text>
              <Text className="w-20 font-bold text-slate-700 text-xs text-center">
                Time In
              </Text>
              <Text className="w-20 font-bold text-slate-700 text-xs text-center">
                Break Out
              </Text>
              <Text className="w-20 font-bold text-slate-700 text-xs text-center">
                Break In
              </Text>
              <Text className="w-20 font-bold text-slate-700 text-xs text-center">
                Time Out
              </Text>
            </View>

            {/* Attendance Rows */}
            <FlatList
              data={attendanceRows}
              keyExtractor={(item) => item.userId}
              renderItem={({ item }) => (
                <AdminAttendanceRow
                  item={item}
                  onPhotoPress={(url, name, org) =>
                    setSelectedPhoto({ url, name, org })
                  }
                />
              )}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              ListEmptyComponent={
                <View className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 items-center justify-center my-6 w-80 self-center">
                  <View className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 items-center justify-center mb-3.5">
                    <UserCheck size={28} color="#395886" />
                  </View>
                  <Text className="text-base font-bold text-brand-500 tracking-tight">
                    No Attendance Records
                  </Text>
                  <Text className="text-xs text-slate-400 text-center mt-1.5 max-w-[240px] leading-relaxed font-medium">
                    No check-in logs found for this event selection.
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      )}

      {/* Full Photo Modal */}
      <AdminPhotoModal
        visible={selectedPhoto !== null}
        imageUrl={selectedPhoto?.url || null}
        name={selectedPhoto?.name || ""}
        organization={selectedPhoto?.org}
        onClose={() => setSelectedPhoto(null)}
      />
    </View>
  );
}
