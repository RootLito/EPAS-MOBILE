import { X } from "lucide-react-native";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";

interface AdminPhotoModalProps {
  visible: boolean;
  imageUrl: string | null;
  name: string;
  organization?: string;
  onClose: () => void;
}

export function AdminPhotoModal({
  visible,
  imageUrl,
  name,
  organization,
  onClose,
}: AdminPhotoModalProps) {
  if (!visible || !imageUrl) return null;

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Container with semi-transparent black background */}
      <View className="flex-1 bg-black/80">
        {/* Header - Floating on top of the black background */}
        <View className="flex-row items-center justify-between px-6 pt-12 pb-4">
          <View className="flex-1 pr-4">
            <Text className="font-bold text-white text-base" numberOfLines={1}>
              {name}
            </Text>
            {organization && (
              <Text className="text-xs text-slate-300" numberOfLines={1}>
                {organization}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Full Screen Image Container */}
        <View className="flex-1 items-center justify-center p-2">
          <Image
            source={{ uri: imageUrl }}
            className="w-full h-full"
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}
