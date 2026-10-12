import React from "react";
import { Text, View } from "react-native";

export interface UserEventAttendanceRow {
  key: string;
  event_id: string;
  event_title: string;
  event_date: string;
  status: "Present" | "Absent" | "Upcoming";
  time_in?: string;
  break_out?: string;
  break_in?: string;
  time_out?: string;
}

interface UserAttendanceRowProps {
  item: UserEventAttendanceRow;
}

export const UserAttendanceRow: React.FC<UserAttendanceRowProps> = ({
  item,
}) => {
  return (
    <View className="flex-row items-center border-b border-slate-100 py-3.5 px-2 bg-white">
      {/* Event Title & Date */}
      <View className="w-52 pr-2">
        <Text className="font-bold text-slate-800 text-base" numberOfLines={1}>
          {item.event_title}
        </Text>
        <Text className="text-xs text-slate-400 font-medium mt-0.5">
          {item.event_date}
        </Text>
      </View>

      {/* Status Indicator */}
      <View className="w-24 items-center justify-center">
        <View
          className={`px-2.5 py-1 rounded-full ${
            item.status === "Present"
              ? "bg-emerald-100"
              : item.status === "Absent"
                ? "bg-rose-100"
                : "bg-slate-100"
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              item.status === "Present"
                ? "text-emerald-700"
                : item.status === "Absent"
                  ? "text-rose-700"
                  : "text-slate-600"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Time In */}
      <View className="w-24 items-center">
        <Text
          className={`font-semibold text-sm ${
            item.time_in ? "text-emerald-600" : "text-slate-300"
          }`}
        >
          {item.time_in || "--:--"}
        </Text>
      </View>

      {/* Break Out */}
      <View className="w-24 items-center">
        <Text
          className={`font-semibold text-sm ${
            item.break_out ? "text-amber-600" : "text-slate-300"
          }`}
        >
          {item.break_out || "--:--"}
        </Text>
      </View>

      {/* Break In */}
      <View className="w-24 items-center">
        <Text
          className={`font-semibold text-sm ${
            item.break_in ? "text-blue-600" : "text-slate-300"
          }`}
        >
          {item.break_in || "--:--"}
        </Text>
      </View>

      {/* Time Out */}
      <View className="w-24 items-center">
        <Text
          className={`font-semibold text-sm ${
            item.time_out ? "text-rose-600" : "text-slate-300"
          }`}
        >
          {item.time_out || "--:--"}
        </Text>
      </View>
    </View>
  );
};
