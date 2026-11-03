import { formatScanTime } from "@/utils/formatTime";
import { CheckCircle2, X, XCircle } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import ConfettiCannon from "react-native-confetti-cannon";

export interface ScanResult {
  type: "success" | "error";
  title: string;
  message?: string;
  userCode?: string;
  userName?: string;
  timeScanned?: string;
}

interface ScanResultModalProps {
  visible: boolean;
  result: ScanResult | null;
  onClose: () => void;
  autoCloseDuration?: number; // default 3000ms
}

export function ScanResultModal({
  visible,
  result,
  onClose,
  autoCloseDuration = 3000,
}: ScanResultModalProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && result) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseDuration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, result, onClose, autoCloseDuration]);

  if (!result) return null;

  const formattedTime = result.timeScanned
    ? formatScanTime(result.timeScanned)
    : "";

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View className="flex-1 bg-black/60 justify-center items-center px-6 relative">
        {/* Confetti Animation on Success */}
        {result.type === "success" && (
          <ConfettiCannon
            count={120}
            origin={{ x: -10, y: 0 }}
            autoStart={true}
            fadeOut={true}
          />
        )}

        <View className="w-full bg-white rounded-3xl p-6 items-center shadow-2xl relative">
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full justify-center items-center"
          >
            <X size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Icon Indicator */}
          {result.type === "success" ? (
            <View className="w-20 h-20 bg-green-100 rounded-full justify-center items-center mb-4">
              <CheckCircle2 size={48} color="#22C55E" />
            </View>
          ) : (
            <View className="w-20 h-20 bg-red-100 rounded-full justify-center items-center mb-4">
              <XCircle size={48} color="#EF4444" />
            </View>
          )}

          {/* Title */}
          <Text className="text-2xl font-bold text-slate-900 text-center mb-1">
            {result.title}
          </Text>

          {/* User Info (Success case) */}
          {result.userName && (
            <View className="w-full bg-slate-50 rounded-2xl p-4 my-3 border border-slate-100 items-center">
              <Text className="text-lg font-extrabold text-slate-800 text-center">
                {result.userName}
              </Text>
              <Text className="text-xs font-semibold text-slate-400 mt-0.5">
                ID: {result.userCode}
              </Text>

              {formattedTime ? (
                <View className="mt-3 bg-brand-50 px-4 py-1.5 rounded-full border border-brand-200/60">
                  <Text className="text-xs font-bold text-brand-500">
                    Scanned at {formattedTime}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Error Message */}
          {result.message && (
            <Text className="text-sm font-medium text-slate-500 text-center my-2">
              {result.message}
            </Text>
          )}

          {/* Action Button */}
          <TouchableOpacity
            onPress={onClose}
            className={`w-full py-3.5 rounded-xl items-center mt-2 ${
              result.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            <Text className="text-white font-bold text-base">Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
