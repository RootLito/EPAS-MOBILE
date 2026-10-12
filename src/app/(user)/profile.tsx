import { useAuth } from "@/context/AuthContext";
import { pickAndUploadAvatar } from "@/services/avatar";
import { updateUserProfile } from "@/services/profile";
import { UserProfile } from "@/types/user";
import {
    Barcode,
    Briefcase,
    Building,
    Check,
    ChevronRight,
    Edit2,
    Lock,
    Pencil,
    Shield,
    User,
    X,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const { user, login } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [fullname, setFullname] = useState(user?.fullname || "");
  const [position, setPosition] = useState(user?.position || "");
  const [office, setOffice] = useState(user?.office || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    user?.avatar_url || null,
  );

  const handlePickAndUploadImage = async () => {
    setUploadingImage(true);
    try {
      const publicUrl = await pickAndUploadAvatar(user as UserProfile);
      if (publicUrl) {
        setAvatarUrl(publicUrl);
        if (user) {
          await login({ ...user, avatar_url: publicUrl } as UserProfile);
        }
        Alert.alert("Success", "Profile picture updated successfully!");
      }
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!fullname.trim() || !position.trim() || !office.trim()) {
      Alert.alert("Validation", "Please fill in all editable fields.");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await updateUserProfile(user as UserProfile, {
        fullname: fullname.trim(),
        position: position.trim(),
        office: office.trim(),
      });

      if (updatedUser) {
        await login(updatedUser);
      }

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err: any) {
      Alert.alert("Update Failed", err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFullname(user?.fullname || "");
    setPosition(user?.position || "");
    setOffice(user?.office || "");
    setIsEditing(false);
  };

  return (
    <ScrollView className="flex-1">
      <View className="flex-row items-center gap-5 mb-8 px-6">
        <View className="relative">
          <View className="w-32 h-32 rounded-full bg-slate-100 items-center justify-center border border-slate-200/60 shadow-sm overflow-hidden">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <User size={38} color="#0f172a" />
            )}

            {uploadingImage && (
              <View className="absolute inset-0 bg-black/40 items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handlePickAndUploadImage}
            disabled={uploadingImage}
            activeOpacity={0.8}
            className="absolute -bottom-1 -right-1 bg-brand-500 w-7 h-7 rounded-full items-center justify-center border-2 border-white shadow-md"
          >
            <Pencil size={12} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View className="flex-1">
          <Text className="text-3xl font-bold text-brand-500 tracking-tight leading-tight">
            {user?.fullname?.split(" ")[0] || "User"}
          </Text>
          <Text className="text-3xl font-light text-slate-400 tracking-tight leading-tight mb-1">
            {user?.fullname?.split(" ").slice(1).join(" ") || "Profile"}
          </Text>
          <Text className="text-sm font-semibold text-slate-400">
            Joined{" "}
            <Text className="font-bold text-slate-700">
              {user?.created_at
                ? new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(user.created_at))
                : "N/A"}
            </Text>
          </Text>
        </View>
      </View>

      <View className="flex-row justify-end items-center mb-4 px-6">
        {!isEditing && (
          <TouchableOpacity
            onPress={() => setIsEditing(true)}
            className="flex-row items-center gap-2 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100"
          >
            <Edit2 size={13} color="#395886" />
            <Text className="text-brand-500 text-sm">Edit Details</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FIELD LIST CONTAINER */}
      <View className="gap-3 px-6 mb-8">
        {/* Full Name */}
        <View className="flex-row items-center justify-between p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
          <View className="flex-row items-center gap-3.5 flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-brand-100/70 items-center justify-center">
              <User size={18} color="#395886" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Full Name
              </Text>
              {isEditing ? (
                <TextInput
                  value={fullname}
                  onChangeText={setFullname}
                  className="font-bold text-slate-800 text-md p-0 mt-0.5"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text className="font-bold text-slate-800 text-md mt-0.5">
                  {fullname || "—"}
                </Text>
              )}
            </View>
          </View>
          {isEditing ? (
            <Edit2 size={14} color="#395886" />
          ) : (
            <ChevronRight size={18} color="#cbd5e1" />
          )}
        </View>

        {/* Position */}
        <View className="flex-row items-center justify-between p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
          <View className="flex-row items-center gap-3.5 flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-brand-100/70 items-center justify-center">
              <Briefcase size={18} color="#395886" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Position
              </Text>
              {isEditing ? (
                <TextInput
                  value={position}
                  onChangeText={setPosition}
                  className="font-bold text-slate-800 text-md p-0 mt-0.5"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text className="font-bold text-slate-800 text-md mt-0.5">
                  {position || "—"}
                </Text>
              )}
            </View>
          </View>
          {isEditing ? (
            <Edit2 size={14} color="#395886" />
          ) : (
            <ChevronRight size={18} color="#cbd5e1" />
          )}
        </View>

        {/* Office / Station */}
        <View className="flex-row items-center justify-between p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100">
          <View className="flex-row items-center gap-3.5 flex-1 mr-2">
            <View className="w-10 h-10 rounded-full bg-brand-100/70 items-center justify-center">
              <Building size={18} color="#395886" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Office / Station
              </Text>
              {isEditing ? (
                <TextInput
                  value={office}
                  onChangeText={setOffice}
                  className="font-bold text-slate-800 text-md p-0 mt-0.5"
                  placeholderTextColor="#94a3b8"
                />
              ) : (
                <Text className="font-bold text-slate-800 text-md mt-0.5">
                  {office || "—"}
                </Text>
              )}
            </View>
          </View>
          {isEditing ? (
            <Edit2 size={14} color="#395886" />
          ) : (
            <ChevronRight size={18} color="#cbd5e1" />
          )}
        </View>

        {/* READ-ONLY: User Code */}
        <View className="flex-row items-center justify-between p-3.5 bg-slate-50/30 rounded-2xl border border-slate-100 opacity-80">
          <View className="flex-row items-center gap-3.5 flex-1">
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
              <Barcode size={18} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                User Code (ID Barcode)
              </Text>
              <Text className="font-bold text-slate-600 text-md mt-0.5">
                {user?.code || "—"}
              </Text>
            </View>
          </View>
          <Lock size={15} color="#cbd5e1" />
        </View>

        {/* READ-ONLY: Role */}
        <View className="flex-row items-center justify-between p-3.5 bg-slate-50/30 rounded-2xl border border-slate-100 opacity-80">
          <View className="flex-row items-center gap-3.5 flex-1">
            <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
              <Shield size={18} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Role
              </Text>
              <Text className="font-bold text-slate-600 text-md mt-0.5 capitalize">
                {user?.role || "—"}
              </Text>
            </View>
          </View>
          <Lock size={15} color="#cbd5e1" />
        </View>
      </View>

      {/* SAVE / CANCEL ACTION BUTTONS */}
      {isEditing && (
        <View className="flex-row items-center gap-3 mb-6">
          <TouchableOpacity
            onPress={handleCancel}
            disabled={loading}
            className="flex-1 py-3.5 bg-slate-100 rounded-2xl items-center flex-row justify-center gap-1.5"
          >
            <X size={16} color="#64748b" />
            <Text className="font-bold text-slate-600 text-md">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={loading}
            className="flex-1 py-3.5 bg-brand-600 rounded-2xl items-center flex-row justify-center gap-1.5 shadow-md"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Check size={16} color="#ffffff" />
                <Text className="font-bold text-white text-md">
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
