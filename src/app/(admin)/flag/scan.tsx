import { FlagAttendance } from "@/components/FlagAttendance";
import { LiveClock } from "@/components/LiveClock";
import { ScanResult, ScanResultModal } from "@/components/ScanResultModal";
import { authService } from "@/services/authService";
import { flagAttendanceService } from "@/services/flagAttendanceService";
import { FlagAttendance as FlagAttendanceType } from "@/types/flagAttendance";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { Info, ListOrdered } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function FlagScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);

  // Data & Scans State
  const [todayScans, setTodayScans] = useState<FlagAttendanceType[]>([]);
  const [loadingScans, setLoadingScans] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Determine current active ceremony based on today's day of week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 1 = Monday, 5 = Friday
  const ceremonyType = dayOfWeek === 5 ? "Flag Lowering" : "Flag Raising";
  const scanDateStr = today.toISOString().split("T")[0];

  const fetchTodayScans = async () => {
    try {
      setLoadingScans(true);
      const data = await flagAttendanceService.getUsersWithAttendance(
        ceremonyType,
        scanDateStr,
      );
      // Filter to show only records that actually scanned (Present or Late)
      const scannedOnly = data.filter((item) => item.status !== "Absent");
      setTodayScans(scannedOnly);
    } catch (error) {
      console.error("Failed to fetch today's scans:", error);
    } finally {
      setLoadingScans(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodayScans();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodayScans();
  };

  if (!permission) {
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-6">
        <Text className="text-center text-gray-700 mb-4 text-base">
          Camera permission is required to scan employee ID barcodes.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-brand-500 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning || scanResult) return;
    setScanning(true);

    try {
      // 1. Check if user exists
      const user = await authService.getUserByCode(data);

      if (!user) {
        setScanResult({
          type: "error",
          title: "User Not Found",
          message: `No registered employee found with ID Code: ${data}`,
        });
        return;
      }

      // 2. Check for existing scan today
      const existingRecord =
        await flagAttendanceService.checkExistingAttendance(
          user.id,
          ceremonyType,
          scanDateStr,
        );

      if (existingRecord) {
        setScanResult({
          type: "error",
          title: "Already Scanned",
          message: `${user.fullname} has already scanned for ${ceremonyType} today!`,
          userCode: user.code,
          userName: user.fullname,
        });
        return;
      }

      // 3. Calculate status
      const nowStr = today.toTimeString().split(" ")[0]; // HH:MM:SS
      const hours = today.getHours();
      const minutes = today.getMinutes();

      let status: "Present" | "Late" = "Present";
      if (
        ceremonyType === "Flag Raising" &&
        (hours > 8 || (hours === 8 && minutes > 0))
      ) {
        status = "Late";
      }

      // 4. Record attendance in database
      await flagAttendanceService.recordAttendance({
        client_id: user.id,
        code: user.code,
        ceremony_type: ceremonyType,
        status: status,
        scan_date: scanDateStr,
        scan_time: nowStr,
      });

      // Refresh live scanned list
      await fetchTodayScans();

      // 5. Show Success Result
      setScanResult({
        type: "success",
        title: status === "Late" ? "Scanned (Late)" : "Attendance Recorded!",
        userCode: user.code,
        userName: user.fullname,
        timeScanned: nowStr,
      });
    } catch (err: any) {
      setScanResult({
        type: "error",
        title: "Scanning Error",
        message:
          err.message || "Something went wrong while recording attendance.",
      });
    }
  };

  const handleCloseModal = () => {
    setScanResult(null);
    setScanning(false);
  };

  return (
    <View className="flex-1 bg-white relative">
      {/* Fixed Header Section */}
      <View className="px-6 mb-3">
        <Text className="text-3xl font-extrabold text-brand-500 tracking-tight">
          Attendance Scan
        </Text>
        <View className="flex-row items-center self-start bg-slate-100 px-3 py-1 rounded-full mt-2">
          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
          <Text className="text-xs font-semibold text-brand-500 uppercase tracking-wider">
            {ceremonyType}
          </Text>
        </View>
      </View>

      {/* Fixed Info Banner */}
      <View className="px-6 my-6">
        <View className="w-full bg-brand-50 border border-brand-200 rounded-xl p-3 flex-row items-center gap-2.5">
          <Info size={20} color="#395886" className="shrink-0" />
          <Text className="text-brand-500 text-sm leading-4 flex-1">
            Align barcode inside the camera box to log flag ceremony attendance.
          </Text>
        </View>
      </View>

      {/* Fixed Camera Box */}
      <View className="px-6 mb-4">
        <View className="w-full h-56 rounded-2xl overflow-hidden border border-brand-200 bg-black relative shadow-md">
          <CameraView
            facing="back"
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "code128", "code39", "ean13"],
            }}
          />

          {scanning && !scanResult && (
            <View className="absolute inset-0 bg-black/60 justify-center items-center">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-white text-xs font-medium mt-2">
                Processing Attendance...
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Fixed Live Ticking Clock */}
      <LiveClock />

      {/* Scanned Today Header */}
      <View className="px-6 mb-2 flex-row items-center justify-between">
        <Text className="text-base font-bold text-slate-800">
          Scanned Today ({todayScans.length})
        </Text>
      </View>

      {/* Scrollable List Container Only */}
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loadingScans ? (
          <View className="py-6 items-center justify-center">
            <ActivityIndicator size="small" color="#0F172A" />
          </View>
        ) : todayScans.length > 0 ? (
          todayScans
            .slice()
            .reverse()
            .map((item) => <FlagAttendance key={item.id} item={item} />)
        ) : (
          <View className="py-8 mx-6 items-center justify-center bg-slate-50 rounded-2xl border border-slate-100">
            <Text className="text-sm font-semibold text-slate-400">
              No scans recorded yet today.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating List / Dashboard Navigation Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.back()}
        className="absolute bottom-8 right-6 w-20 h-20 rounded-full bg-brand-500 justify-center items-center shadow-lg border border-white/20 z-50"
        style={{
          elevation: 6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
        }}
      >
        <ListOrdered size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Reusable Result Modal */}
      <ScanResultModal
        visible={!!scanResult}
        result={scanResult}
        onClose={handleCloseModal}
      />
    </View>
  );
}
