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

import {
    UserAttendanceRow,
    UserEventAttendanceRow,
} from "@/components/UserAttendanceRow";
import { supabase } from "@/lib/supabase";
import { attendanceService } from "@/services/attendanceService";
import { Attendance } from "@/types/attendance";
import { Event } from "@/types/event";

export default function AttendanceScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userLogs, setUserLogs] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Always fetch events first
      const fetchedEvents = await attendanceService.getEvents();
      setEvents(fetchedEvents);

      // Fetch user session safely
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const fetchedLogs = await attendanceService.getUserAttendanceLogs(
          user.id,
          selectedEvent?.id,
        );
        setUserLogs(fetchedLogs);
      } else {
        setUserLogs([]);
      }
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

  // Map all events to rows and attach logs if present
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
      };

      logs.forEach((log) => {
        const formatted = formatTime(log.scanned_at);
        if (log.scan_type === "time_in" && !row.time_in)
          row.time_in = formatted;
        if (log.scan_type === "break_out" && !row.break_out)
          row.break_out = formatted;
        if (log.scan_type === "break_in" && !row.break_in)
          row.break_in = formatted;
        if (log.scan_type === "time_out" && !row.time_out)
          row.time_out = formatted;
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
      {/* Page Header */}
      <Text className="text-3xl font-extrabold text-brand-500 mb-4 tracking-tight">
        My Attendance
      </Text>

      {/* Search Input */}
      <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-3 border border-slate-200/50">
        <Search size={20} color="#94A3B8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Event title..."
          placeholderTextColor="#94A3B8"
          className="flex-1 ml-3 text-base text-slate-800 font-medium p-0"
        />
      </View>

      {/* Event Filter Dropdown */}
      <View className="z-20 mb-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex-row items-center justify-between bg-slate-100 px-4 py-3 rounded-2xl border border-slate-200/50"
        >
          <View className="flex-row items-center flex-1 pr-2">
            <Calendar size={18} color="#64748B" />
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
                  <Text className="text-xs text-slate-400 mt-0.5">
                    {formatDate(ev.start_date)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Attendance Table */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0284C7" />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          className="flex-1"
        >
          <View>
            <View className="flex-row bg-slate-100 py-3 px-2 rounded-xl border border-slate-200/60 mb-2">
              <Text className="w-52 font-bold text-slate-700 text-sm">
                Event
              </Text>
              <Text className="w-24 font-bold text-slate-700 text-sm text-center">
                Status
              </Text>
              <Text className="w-24 font-bold text-slate-700 text-sm text-center">
                Time In
              </Text>
              <Text className="w-24 font-bold text-slate-700 text-sm text-center">
                Break Out
              </Text>
              <Text className="w-24 font-bold text-slate-700 text-sm text-center">
                Break In
              </Text>
              <Text className="w-24 font-bold text-slate-700 text-sm text-center">
                Time Out
              </Text>
            </View>

            <FlatList
              data={attendanceRows}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => <UserAttendanceRow item={item} />}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              ListEmptyComponent={
                <View className="py-12 items-center justify-center">
                  <UserCheck size={40} color="#CBD5E1" />
                  <Text className="text-slate-400 font-medium text-base mt-2">
                    No events found.
                  </Text>
                </View>
              }
            />
          </View>
        </ScrollView>
      )}
    </View>
  );
}
