import { X } from "lucide-react-native";
import {
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ImageGalleryModalProps {
  visible: boolean;
  images: string[];
  selectedImage: string | null;
  onSelectImage: (url: string) => void;
  onClose: () => void;
}

export function ImageGalleryModal({
  visible,
  images,
  selectedImage,
  onSelectImage,
  onClose,
}: ImageGalleryModalProps) {
  if (!images.length) return null;

  const currentIndex = selectedImage ? images.indexOf(selectedImage) + 1 : 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black">
        {/* Full Screen Image Background Layer */}
        <View className="absolute inset-0 justify-center items-center">
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </View>

        {/* Foreground UI Layer (Safe Area) */}
        <SafeAreaView
          className="flex-1 justify-between"
          edges={["top", "bottom"]}
        >
          {/* Top Bar / Close Button */}
          <View className="flex-row justify-between items-center px-6 pt-2 z-10 bg-black/20 pb-2">
            <Text className="text-white text-xs font-bold tracking-wider uppercase">
              Photo Gallery ({currentIndex} / {images.length})
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              className="w-10 h-10 rounded-full bg-black/50 items-center justify-center border border-white/20"
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View className="flex-1" />

          {/* Bottom Horizontal Scrollable Thumbnails */}
          <View className="py-3 bg-black/60 z-10">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {images.map((url, index) => {
                const isSelected = selectedImage === url;
                return (
                  <TouchableOpacity
                    key={url || index}
                    activeOpacity={0.8}
                    onPress={() => onSelectImage(url)}
                    className={`rounded-xl overflow-hidden border-2 ${
                      isSelected
                        ? "border-white"
                        : "border-transparent opacity-50"
                    }`}
                  >
                    <Image
                      source={{ uri: url }}
                      className="w-16 h-16 rounded-lg"
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
