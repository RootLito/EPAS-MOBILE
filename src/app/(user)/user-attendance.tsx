// app/(user)/attendance.tsx
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

import { AdminPhotoModal } from "@/components/admin/AdminPhotoModal";
import {
    UserAttendanceRow,
    UserEventAttendanceRow,
} from "@/components/UserAttendanceRow";
import { useAuth } from "@/context/AuthContext";
import { attendanceService } from "@/services/attendanceService";
import { Attendance } from "@/types/attendance";
import { Event } from "@/types/event";

export default function AttendanceScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLogs, setUserLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState<{
    url: string | null;
    title: string;
  } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const fetchedEvents = await attendanceService.getEvents();
      setEvents(fetchedEvents);

      if (user?.id) {
        const fetchedLogs = await attendanceService.getUserAttendanceLogs(
          user.id,
          selectedEvent?.id,
        );
        setUserLogs(fetchedLogs || []);
      } else {
        setUserLogs([]);
      }
    } catch (err) {
      console.error("Failed to load user attendance data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [selectedEvent, user?.id]);

  const formatTime = (isoString?: string) => {
    if (!isoString) return undefined;
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const attendanceRows = useMemo<UserEventAttendanceRow[]>(() => {
    const logsByEvent: Record<string, Attendance[]> = {};
    userLogs.forEach((log) => {
      if (!logsByEvent[log.event_id]) {
        logsByEvent[log.event_id] = [];
      }
      logsByEvent[log.event_id].push(log);
    });

    const displayEvents = selectedEvent
      ? events.filter((e) => e.id === selectedEvent.id)
      : events;

    const rows: UserEventAttendanceRow[] = displayEvents.map((ev) => {
      const logs = logsByEvent[ev.id] || [];
      const hasLogs = logs.length > 0;

      let status: "Present" | "Absent" | "Upcoming" = "Absent";
      const now = new Date();
      const startDate = new Date(ev.start_date);

      if (hasLogs) {
        status = "Present";
      } else if (startDate > now) {
        status = "Upcoming";
      } else {
        status = "Absent";
      }

      const row: UserEventAttendanceRow = {
        key: ev.id,
        event_id: ev.id,
        event_title: ev.title,
        event_date: formatDate(ev.start_date),
        status,
        time_in: undefined,
        break_out: undefined,
        break_in: undefined,
        time_out: undefined,
        time_in_photo: null,
        break_out_photo: null,
        break_in_photo: null,
        time_out_photo: null,
      };

      logs.forEach((log) => {
        const formatted = formatTime(log.scanned_at);
        const scanTypeLower = log.scan_type?.toLowerCase();

        if (scanTypeLower && formatted) {
          if (scanTypeLower === "time_in") {
            row.time_in = formatted;
            row.time_in_photo = log.selfie_url;
          }
          if (scanTypeLower === "break_out") {
            row.break_out = formatted;
            row.break_out_photo = log.selfie_url;
          }
          if (scanTypeLower === "break_in") {
            row.break_in = formatted;
            row.break_in_photo = log.selfie_url;
          }
          if (scanTypeLower === "time_out") {
            row.time_out = formatted;
            row.time_out_photo = log.selfie_url;
          }
        }
      });

      return row;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return rows.filter((r) => r.event_title.toLowerCase().includes(q));
    }

    return rows;
  }, [events, userLogs, selectedEvent, searchQuery]);

  return (
    <View className="flex-1 px-6 bg-white">
      <Text className="text-3xl font-extrabold text-brand-500 mb-4 tracking-tight mt-2">
        My Attendance
      </Text>

      <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-3 border border-slate-200/50">
        <Search size={18} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Event title..."
          placeholderTextColor="#94A3B8"
          className="flex-1 ml-3 text-sm text-slate-800 font-medium p-0"
        />
      </View>

      {/* Event Filter Dropdown */}
      <View className="mb-4">
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

        {/* No more absolute! It is now part of the flow. It will scroll perfectly. */}
        {isDropdownOpen && (
          <View className="h-52 mt-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <TouchableOpacity
                onPress={() => {
                  setSelectedEvent(null);
                  setIsDropdownOpen(false);
                }}
                className={`px-4 py-3 border-b border-slate-100 ${selectedEvent === null ? "bg-slate-50" : ""}`}
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
                  className={`px-4 py-3 border-b border-slate-100 ${selectedEvent?.id === ev.id ? "bg-slate-50" : ""}`}
                >
                  <Text
                    className="font-medium text-slate-700"
                    numberOfLines={1}
                  >
                    {ev.title}
                  </Text>
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {formatDate(ev.start_date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

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
            <View className="flex-row bg-slate-100 py-3 px-2 rounded-xl border border-slate-200/60 mb-2">
              <Text className="w-52 font-bold text-slate-700 text-xs">
                Event
              </Text>
              <Text className="w-24 font-bold text-slate-700 text-xs text-center">
                Status
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

            <FlatList
              data={attendanceRows}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <UserAttendanceRow
                  item={item}
                  onPhotoPress={(url, title) =>
                    setSelectedPhoto({ url, title })
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
                    You haven't checked in to any events yet.
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      )}

      <AdminPhotoModal
        visible={selectedPhoto !== null}
        imageUrl={selectedPhoto?.url || null}
        name={selectedPhoto?.title || ""}
        onClose={() => setSelectedPhoto(null)}
      />
    </View>
  );
}
