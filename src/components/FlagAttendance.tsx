import { FlagAttendance as FlagAttendanceType } from "@/types/flagAttendance";
import { formatScanTime } from "@/utils/formatTime";
import { Text, View } from "react-native";

interface FlagAttendanceProps {
  item: FlagAttendanceType;
}

export function FlagAttendance({ item }: FlagAttendanceProps) {
  const isPresent =
    item.status.toLowerCase() === "present" ||
    item.status.toLowerCase() === "on time";
  const formattedTime = formatScanTime(item.scan_time);

  return (
    <View className="flex-row items-center bg-slate-50 p-4 my-1.5 w-full rounded-2xl border border-slate-200/60">
      {/* Status Circle Indicator */}
      <View
        className={`w-3 h-3 rounded-full mr-3.5 ${isPresent ? "bg-green-500" : "bg-red-500"}`}
      />

      {/* Name and Office Info */}
      <View className="flex-1">
        <Text className="text-lg font-bold text-brand-500">
          {item.user?.fullname || "Unknown User"}
        </Text>
        <Text className="text-xs font-medium text-slate-400 mt-0.5">
          {item.user?.office || item.code}
        </Text>
      </View>

      {/* Ceremony Type & Formatted Time */}
      <View className="items-end">
        <Text className="text-[11px] font-semibold text-slate-400 mb-0.5 uppercase tracking-wider">
          {item.ceremony_type}
        </Text>
        <Text className="text-sm font-bold text-slate-800">
          {formattedTime}
        </Text>
      </View>
    </View>
  );
}
