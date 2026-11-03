// components/attendance/AttendanceScanner.tsx
import { AttendanceScanType } from "@/types/attendance";
import { CameraView, PermissionResponse } from "expo-camera";
import { Camera, CheckCircle2, Info, RefreshCw, X } from "lucide-react-native";
import { useRef } from "react";
import {
    ActivityIndicator,
    Image,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AttendanceScannerProps {
  step: "qr" | "selfie" | "preview";
  activeScanType: AttendanceScanType;
  permission: PermissionResponse | null;
  scanned: boolean;
  submitting: boolean;
  capturedPhoto: { uri: string; base64?: string } | null;
  onRequestPermission: () => void;
  onBarCodeScanned: (result: { data: string }) => void;
  onTakeSelfie: (photo: { uri: string; base64?: string }) => void;
  onRetake: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function AttendanceScanner({
  step,
  activeScanType,
  permission,
  scanned,
  submitting,
  capturedPhoto,
  onRequestPermission,
  onBarCodeScanned,
  onTakeSelfie,
  onRetake,
  onCancel,
  onConfirm,
}: AttendanceScannerProps) {
  const cameraRef = useRef<any>(null);

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });
      if (photo?.uri && photo?.base64) {
        onTakeSelfie({ uri: photo.uri, base64: photo.base64 });
      }
    } catch (err) {
      console.error("Camera capture error:", err);
    }
  };

  return (
    <View className="items-center justify-center pt-2 pb-2">
      <View className="relative bg-black rounded-3xl overflow-hidden border border-slate-200/80 shadow-sm w-full max-w-[280px] h-[320px]">
        {!permission ? (
          <View className="flex-1 items-center justify-center bg-slate-900 p-4">
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        ) : !permission.granted ? (
          <View className="flex-1 items-center justify-center bg-slate-900 p-6 text-center">
            <Camera size={36} color="#94A3B8" />
            <Text className="text-xs text-slate-300 text-center mt-2 mb-3">
              Camera permission is required.
            </Text>
            <TouchableOpacity
              onPress={onRequestPermission}
              className="px-4 py-2 bg-brand-500 rounded-xl"
            >
              <Text className="text-white text-xs font-bold">
                Grant Permission
              </Text>
            </TouchableOpacity>
          </View>
        ) : step === "qr" ? (
          /* 1. QR Code Scanner View */
          <View className="flex-1 relative">
            {/* Self-closing CameraView without children */}
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={scanned ? undefined : onBarCodeScanned}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            />

            {/* Overlays as siblings */}
            {scanned && (
              <View className="absolute inset-0 bg-black/60 items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white text-xs font-semibold mt-2">
                  Validating QR...
                </Text>
              </View>
            )}

            {/* Corner Frame Lines */}
            <View className="absolute top-4 left-4 w-5 h-5 border-t-2 border-l-2 border-white rounded-tl-sm pointer-events-none" />
            <View className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-white rounded-tr-sm pointer-events-none" />
            <View className="absolute bottom-4 left-4 w-5 h-5 border-b-2 border-l-2 border-white rounded-bl-sm pointer-events-none" />
            <View className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-white rounded-br-sm pointer-events-none" />
          </View>
        ) : step === "selfie" ? (
          /* 2. Front Camera Selfie View */
          <View className="flex-1 relative">
            {/* Self-closing CameraView without children */}
            <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={onCancel}
              className="absolute top-3 right-3 bg-black/50 p-2 rounded-full z-10"
            >
              <X size={16} color="#ffffff" />
            </TouchableOpacity>

            {/* Shutter Button */}
            <View className="absolute bottom-4 inset-x-0 items-center">
              <TouchableOpacity
                onPress={capturePhoto}
                className="w-14 h-14 rounded-full border-4 border-white bg-red-500 items-center justify-center shadow-lg"
                activeOpacity={0.8}
              >
                <Camera size={20} color="#ffffff" />
              </TouchableOpacity>
              <Text className="text-[11px] text-white font-bold mt-1 shadow-sm">
                Take Selfie
              </Text>
            </View>
          </View>
        ) : (
          /* 3. Photo Preview View */
          <View className="flex-1 bg-slate-900 relative">
            {capturedPhoto?.uri && (
              <Image
                source={{ uri: capturedPhoto.uri }}
                className="w-full h-full"
                resizeMode="cover"
              />
            )}

            <View className="absolute bottom-3 inset-x-3 flex-row gap-2">
              <TouchableOpacity
                onPress={onRetake}
                disabled={submitting}
                className="flex-1 py-2.5 bg-slate-800/90 rounded-xl items-center justify-center flex-row gap-1"
              >
                <RefreshCw size={14} color="#ffffff" />
                <Text className="text-white text-xs font-bold">Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onConfirm}
                disabled={submitting}
                className="flex-1 py-2.5 bg-emerald-600 rounded-xl items-center justify-center flex-row gap-1"
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle2 size={14} color="#ffffff" />
                    <Text className="text-white text-xs font-bold">
                      Confirm
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Step Helper Badge */}
      <View
        className={`border rounded-full px-4 py-1.5 mt-3 flex-row items-center gap-2 ${
          step === "qr"
            ? "bg-emerald-50 border-emerald-500"
            : step === "selfie"
              ? "bg-amber-50 border-amber-500"
              : "bg-blue-50 border-blue-500"
        }`}
      >
        <Info
          size={14}
          color={
            step === "qr"
              ? "#059669"
              : step === "selfie"
                ? "#D97706"
                : "#2563EB"
          }
        />
        <Text
          className={`text-xs font-medium ${
            step === "qr"
              ? "text-emerald-700"
              : step === "selfie"
                ? "text-amber-700"
                : "text-blue-700"
          }`}
        >
          {step === "qr" &&
            `Scan QR for: ${activeScanType.replace("_", " ").toUpperCase()}`}
          {step === "selfie" && "Take a clear selfie"}
          {step === "preview" && "Confirm your attendance photo"}
        </Text>
      </View>
    </View>
  );
}
