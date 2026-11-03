import { AttendanceScanType } from "@/types/attendance";
import { Clock } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

interface ScanModeSelectorProps {
  timelineType?: string;
  activeScanType: AttendanceScanType;
  onSelect: (type: AttendanceScanType) => void;
}

export function ScanModeSelector({
  timelineType,
  activeScanType,
  onSelect,
}: ScanModeSelectorProps) {
  const modes: { label: string; type: AttendanceScanType }[] =
    timelineType === "time_in_only"
      ? [{ label: "Time In", type: "time_in" }]
      : timelineType === "in_out"
        ? [
            { label: "Time In", type: "time_in" },
            { label: "Time Out", type: "time_out" },
          ]
        : [
            { label: "Time In", type: "time_in" },
            { label: "Break Out", type: "break_out" },
            { label: "Break In", type: "break_in" },
            { label: "Time Out", type: "time_out" },
          ];

  return (
    <View className="mb-4">
      <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        Select Scan Mode
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {modes.map((m) => {
          const isActive = activeScanType === m.type;
          return (
            <TouchableOpacity
              key={m.type}
              onPress={() => onSelect(m.type)}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-xl flex-row items-center justify-center gap-1.5 ${
                isActive
                  ? "bg-brand-500"
                  : "bg-slate-50 border border-slate-200"
              }`}
            >
              <Clock size={13} color={isActive ? "#ffffff" : "#64748B"} />
              <Text
                className={`text-xs font-bold ${
                  isActive ? "text-white" : "text-slate-600"
                }`}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
