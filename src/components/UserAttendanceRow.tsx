// components/UserAttendanceRow.tsx
import { Image, Text, TouchableOpacity, View } from "react-native";

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
  time_in_photo?: string | null;
  break_out_photo?: string | null;
  break_in_photo?: string | null;
  time_out_photo?: string | null;
}

interface UserAttendanceRowProps {
  item: UserEventAttendanceRow;
  onPhotoPress: (url: string, title: string) => void;
}

interface ScanSlotProps {
  time?: string;
  photoUrl?: string | null;
  onPress?: () => void;
}

function ScanSlot({ time, photoUrl, onPress }: ScanSlotProps) {
  return (
    <View className="w-20 items-center justify-center">
      {photoUrl ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPress}
          className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-1"
        >
          <Image
            source={{ uri: photoUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        </TouchableOpacity>
      ) : (
        <View className="w-14 h-14 rounded-xl border border-dashed border-slate-200 bg-slate-50 items-center justify-center mb-1">
          <Text className="text-[10px] text-slate-400">No Log</Text>
        </View>
      )}

      <Text className="text-[11px] font-bold text-slate-700">
        {time || "—"}
      </Text>
    </View>
  );
}

export function UserAttendanceRow({
  item,
  onPhotoPress,
}: UserAttendanceRowProps) {
  const isPresent = item.status === "Present";
  const isUpcoming = item.status === "Upcoming";

  return (
    <View className="flex-row items-center py-3 px-2 border-b border-slate-100 bg-white">
      {/* Event Title & Date */}
      <View className="w-52 pr-2">
        <Text
          className="font-bold text-slate-800 text-sm leading-tight"
          numberOfLines={1}
        >
          {item.event_title}
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
          {item.event_date}
        </Text>
      </View>

      {/* Status Badge with explicit static NativeWind classes */}
      <View className="w-24 items-center justify-center">
        <View
          className={`px-3 py-1 rounded-full border ${
            isPresent
              ? "bg-emerald-100 border-emerald-300"
              : isUpcoming
                ? "bg-blue-100 border-blue-300"
                : "bg-slate-100 border-slate-300"
          }`}
        >
          <Text
            className={`text-[11px] font-bold ${
              isPresent
                ? "text-emerald-800"
                : isUpcoming
                  ? "text-blue-800"
                  : "text-slate-700"
            }`}
          >
            {item.status}
          </Text>
        </View>
      </View>

      {/* Time In */}
      <ScanSlot
        time={item.time_in}
        photoUrl={item.time_in_photo}
        onPress={() =>
          item.time_in_photo &&
          onPhotoPress(item.time_in_photo, `${item.event_title} (Time In)`)
        }
      />

      {/* Break Out */}
      <ScanSlot
        time={item.break_out}
        photoUrl={item.break_out_photo}
        onPress={() =>
          item.break_out_photo &&
          onPhotoPress(item.break_out_photo, `${item.event_title} (Break Out)`)
        }
      />

      {/* Break In */}
      <ScanSlot
        time={item.break_in}
        photoUrl={item.break_in_photo}
        onPress={() =>
          item.break_in_photo &&
          onPhotoPress(item.break_in_photo, `${item.event_title} (Break In)`)
        }
      />

      {/* Time Out */}
      <ScanSlot
        time={item.time_out}
        photoUrl={item.time_out_photo}
        onPress={() =>
          item.time_out_photo &&
          onPhotoPress(item.time_out_photo, `${item.event_title} (Time Out)`)
        }
      />
    </View>
  );
}
