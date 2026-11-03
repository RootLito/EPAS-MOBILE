// app/(admin)/flag/index.tsx
import { FlagAttendance } from "@/components/FlagAttendance";
import { flagAttendanceService } from "@/services/flagAttendanceService";
import { FlagAttendance as FlagAttendanceType } from "@/types/flagAttendance";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { Calendar, Scan, Search } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Status Filter Pills
const STATUS_PILLS = [
  { id: "All", label: "All Status", dotColor: null },
  { id: "Present", label: "Present", dotColor: "bg-emerald-500" },
  { id: "Did Not Attend", label: "Did Not Attend", dotColor: "bg-rose-500" },
];

export default function FlagAttendanceIndex() {
  const router = useRouter();

  // Date State (default to today)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Ceremony Type (Flag Raising vs Flag Lowering)
  const [ceremonyType, setCeremonyType] = useState<
    "Flag Raising" | "Flag Lowering"
  >(() => {
    return new Date().getDay() === 5 ? "Flag Lowering" : "Flag Raising";
  });

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatusTab, setSelectedStatusTab] = useState("All");

  const [attendanceList, setAttendanceList] = useState<FlagAttendanceType[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Format date as YYYY-MM-DD for database query
  const formattedTargetDate = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, [selectedDate]);

  // Formatted human-readable date for the UI
  const displayDateStr = useMemo(() => {
    return selectedDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [selectedDate]);

  const handleDateChange = (
    event: DateTimePickerEvent,
    date?: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (date.getDay() === 1) setCeremonyType("Flag Raising");
      if (date.getDay() === 5) setCeremonyType("Flag Lowering");
    }
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await flagAttendanceService.getUsersWithAttendance(
        ceremonyType,
        formattedTargetDate,
      );
      setAttendanceList(data);
    } catch (error: any) {
      console.error("Failed to fetch flag attendance:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [ceremonyType, formattedTargetDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAttendance();
  };

  const filteredAttendance = useMemo(() => {
    return attendanceList.filter((item) => {
      const name = item.user?.fullname?.toLowerCase() || "";
      const office = item.user?.office?.toLowerCase() || "";
      const query = searchQuery.toLowerCase();
      const matchesSearch = name.includes(query) || office.includes(query);

      let matchesStatus = true;
      const statusLower = item.status?.toLowerCase() || "";

      if (selectedStatusTab === "Present") {
        matchesStatus =
          statusLower === "present" ||
          statusLower === "on time" ||
          statusLower === "late";
      } else if (selectedStatusTab === "Did Not Attend") {
        matchesStatus =
          statusLower === "absent" ||
          statusLower === "did not attend" ||
          statusLower === "not attended";
      }

      return matchesSearch && matchesStatus;
    });
  }, [attendanceList, searchQuery, selectedStatusTab]);

  return (
    <View className="flex-1 bg-white relative">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Page Title */}
        <Text className="text-3xl font-extrabold text-brand-500 mb-4 tracking-tight mt-2">
          Flag Attendance
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-3 border border-slate-200/50">
          <Search size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or office..."
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-base text-slate-800 font-medium p-0"
          />
        </View>

        {/* Date Picker Button & Ceremony Toggle with Brand Colors */}
        <View className="flex-row gap-2 mb-4">
          {/* Date Picker Trigger Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowDatePicker(true)}
            className="flex-1 flex-row items-center justify-between bg-slate-100 px-3.5 py-3 rounded-2xl border border-slate-200/60"
          >
            <View className="flex-row items-center gap-2">
              <Calendar size={18} color="#395886" />
              <View>
                <Text className="text-[10px] font-bold uppercase text-slate-400">
                  Date
                </Text>
                <Text className="text-xs font-bold text-slate-800">
                  {displayDateStr}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Ceremony Type Selector */}
          <View className="flex-row bg-slate-100 rounded-2xl p-1 border border-slate-200/60">
            <TouchableOpacity
              onPress={() => setCeremonyType("Flag Raising")}
              className={`px-3 py-2 rounded-xl justify-center items-center ${
                ceremonyType === "Flag Raising" ? "bg-brand-500 shadow-xs" : ""
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  ceremonyType === "Flag Raising"
                    ? "text-white"
                    : "text-slate-600"
                }`}
              >
                Raising
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCeremonyType("Flag Lowering")}
              className={`px-3 py-2 rounded-xl justify-center items-center ${
                ceremonyType === "Flag Lowering" ? "bg-brand-500 shadow-xs" : ""
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  ceremonyType === "Flag Lowering"
                    ? "text-white"
                    : "text-slate-600"
                }`}
              >
                Lowering
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Native Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
          />
        )}

        {/* Status Filter Pill Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4 -mx-6 px-6"
        >
          <View className="flex-row gap-2 pr-6">
            {STATUS_PILLS.map((pill) => {
              const isActive = selectedStatusTab === pill.id;
              return (
                <TouchableOpacity
                  key={pill.id}
                  onPress={() => setSelectedStatusTab(pill.id)}
                  className={`flex-row items-center gap-2 px-4 py-2 rounded-full ${
                    isActive
                      ? "bg-brand-500"
                      : "bg-slate-100 border border-slate-200/80"
                  }`}
                >
                  {pill.dotColor && (
                    <View className={`w-2 h-2 rounded-full ${pill.dotColor}`} />
                  )}
                  <Text
                    className={`text-xs font-semibold ${
                      isActive ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {pill.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Attendance List */}
        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#395886" />
          </View>
        ) : filteredAttendance.length > 0 ? (
          filteredAttendance.map((item) => (
            <FlagAttendance key={item.id} item={item} />
          ))
        ) : (
          <View className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 items-center justify-center my-6">
            <View className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 items-center justify-center mb-3.5">
              <Calendar size={28} color="#395886" />
            </View>
            <Text className="text-base font-bold text-brand-500 tracking-tight">
              No Attendance Records
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1.5 max-w-[240px] leading-relaxed font-medium">
              There are no flag ceremony attendance logs found for this date.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Scan Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push("/(admin)/flag/scan" as any)}
        className="absolute bottom-8 right-6 w-20 h-20 rounded-full bg-brand-500 justify-center items-center shadow-lg border border-white/20 z-50"
        style={{
          elevation: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <Scan size={28} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
