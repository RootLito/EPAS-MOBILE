// components/admin/AdminAttendanceRow.tsx
import { AttendanceRow } from "@/types/attendance";
import { Image, Text, TouchableOpacity, View } from "react-native";

interface AdminAttendanceRowProps {
  item: AttendanceRow;
  onPhotoPress: (url: string, name: string, org: string) => void;
}

interface ScanSlotProps {
  time: string | null;
  photoUrl?: string | null;
  onPress?: () => void;
}

function ScanSlot({ time, photoUrl, onPress }: ScanSlotProps) {
  const formatTime = (isoString: string | null) => {
    if (!isoString) return null;
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formattedTime = formatTime(time);

  return (
    <View className="w-20 items-center justify-center">
      {/* Photo Thumbnail or Dashed "No Log" Box */}
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

      {/* Time Text or Dash */}
      <Text className="text-[11px] font-bold text-slate-700">
        {formattedTime || "—"}
      </Text>
    </View>
  );
}

export function AdminAttendanceRow({
  item,
  onPhotoPress,
}: AdminAttendanceRowProps) {
  return (
    <View className="flex-row items-center py-3 px-2 border-b border-slate-100 bg-white">
      {/* Name & Office / Organization */}
      <View className="w-48 pr-2">
        <Text
          className="font-bold text-slate-800 text-sm leading-tight"
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
          {item.office}
        </Text>
      </View>

      {/* Time In */}
      <ScanSlot
        time={item.time_in}
        photoUrl={item.time_in_photo}
        onPress={() =>
          item.time_in_photo &&
          onPhotoPress(item.time_in_photo, item.name, item.office)
        }
      />

      {/* Break Out */}
      <ScanSlot
        time={item.break_out}
        photoUrl={item.break_out_photo}
        onPress={() =>
          item.break_out_photo &&
          onPhotoPress(item.break_out_photo, item.name, item.office)
        }
      />

      {/* Break In */}
      <ScanSlot
        time={item.break_in}
        photoUrl={item.break_in_photo}
        onPress={() =>
          item.break_in_photo &&
          onPhotoPress(item.break_in_photo, item.name, item.office)
        }
      />

      {/* Time Out */}
      <ScanSlot
        time={item.time_out}
        photoUrl={item.time_out_photo}
        onPress={() =>
          item.time_out_photo &&
          onPhotoPress(item.time_out_photo, item.name, item.office)
        }
      />
    </View>
  );
}
