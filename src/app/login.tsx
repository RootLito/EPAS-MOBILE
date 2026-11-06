import { RegisterModal } from "@/components/RegisterModal";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { CameraOff, Info, Settings } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const { login } = useAuth();

  const handleRequestPermission = async () => {
    if (!permission?.canAskAgain) {
      Linking.openSettings();
    } else {
      const result = await requestPermission();
      if (!result.granted && !result.canAskAgain) {
        Linking.openSettings();
      }
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);

    try {
      const existingUser = await authService.getUserByCode(data);

      if (existingUser) {
        await login(existingUser);
      } else {
        setScannedCode(data);
        setShowRegister(true);
      }
    } catch (err: any) {
      Alert.alert("Scan Error", err.message);
      setScanning(false);
    }
  };

  const isPermanentlyDenied =
    permission && !permission.granted && !permission.canAskAgain;

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 justify-between items-center pt-6 pb-0 px-0"
      edges={["top", "left", "right"]}
    >
      {/* Top Header */}
      <View className="items-center mt-4 px-6">
        <Image
          source={require("@/assets/images/bfar.png")}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
          className="mb-3"
        />
        <Text className="text-5xl font-extrabold text-brand-500 tracking-wider">
          BFAR XI - EPAS
        </Text>
        <Text className="text-sm text-brand-400 tracking-wide mt-1">
          Event Planner and Attendance System
        </Text>
      </View>

      {/* Middle Section */}
      <View className="w-full items-center px-6">
        <View className="w-full bg-brand-50 border border-brand-200 rounded-xl p-3 mb-5 flex-row items-center gap-2.5">
          <Info size={20} color="#395886" className="shrink-0" />
          <Text className="text-brand-500 text-sm leading-5 flex-1">
            {permission?.granted
              ? "Position the barcode inside the camera box below to automatically log in or register."
              : "Camera access is needed to scan your ID barcode."}
          </Text>
        </View>

        {/* Dynamic Box: Camera View OR Grant Permission Card */}
        {!permission ? (
          <View className="w-full h-64 rounded-2xl border border-brand-200 bg-white items-center justify-center shadow-sm">
            <ActivityIndicator size="large" color="#395886" />
          </View>
        ) : permission.granted ? (
          <View className="w-full h-64 rounded-2xl overflow-hidden border border-brand-200 bg-black relative shadow-md">
            <CameraView
              facing="back"
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "code128", "code39", "ean13"],
              }}
            />

            {scanning && !showRegister && (
              <View className="absolute inset-0 bg-black/60 justify-center items-center">
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-white text-xs font-medium mt-2">
                  Processing ID...
                </Text>
              </View>
            )}
          </View>
        ) : (
          /* Grant Permission Card replacing the camera box */
          <View className="w-full h-64 rounded-2xl border border-brand-200 bg-white items-center justify-center p-5 shadow-sm">
            <View className="w-14 h-14 rounded-full bg-brand-50 items-center justify-center mb-3">
              <CameraOff size={24} color="#395886" />
            </View>

            <Text className="text-base font-bold text-slate-800 text-center mb-1">
              Camera Access Required
            </Text>
            <Text className="text-xs text-slate-500 text-center mb-4 leading-4">
              {isPermanentlyDenied
                ? "Permission is blocked. Please allow camera access in settings."
                : "Allow camera permission to scan your ID barcode."}
            </Text>

            <TouchableOpacity
              onPress={handleRequestPermission}
              activeOpacity={0.85}
              className="bg-brand-500 px-5 py-2.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
            >
              {isPermanentlyDenied ? (
                <>
                  <Settings size={15} color="#ffffff" />
                  <Text className="text-white font-semibold text-sm">
                    Open Settings
                  </Text>
                </>
              ) : (
                <Text className="text-white font-semibold text-sm">
                  Grant Permission
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <Text className="text-brand-500 text-sm mt-12">
          Developed by RFIMU | BFAR XI © 2026
        </Text>
      </View>

      {/* Footer Image */}
      <View className="w-full relative items-center justify-end">
        <Image
          source={require("@/assets/images/back.png")}
          className="w-full h-40"
          resizeMode="cover"
        />
      </View>

      {scannedCode && (
        <RegisterModal
          visible={showRegister}
          code={scannedCode}
          onSuccess={async (newUser) => {
            setShowRegister(false);
            await login(newUser);
          }}
          onCancel={() => {
            setShowRegister(false);
            setScannedCode(null);
            setScanning(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}
