import { EventCard } from "@/components/EventCard";
import { EventDetailModal } from "@/components/EventDetailModal";
import { QRCodeModal } from "@/components/QRCodeModal";
import { getEvents } from "@/services/eventService";
import { Event } from "@/types";
import { Search, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const FILTER_TABS = ["All", "Upcoming", "Ongoing", "Completed"];

export default function EventIndex() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Full-screen Image State
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // QR Code Modal State
  const [selectedQrEvent, setSelectedQrEvent] = useState<Event | null>(null);

  // Detail View Modal State
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<Event | null>(
    null,
  );

  const fetchEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (error: any) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Filter events by tab status and search query
  const filteredEvents = events.filter((event) => {
    const matchesTab =
      selectedTab === "All" ||
      event.status?.toLowerCase() === selectedTab.toLowerCase();

    const matchesSearch =
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.venue?.address?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  return (
    <View className="flex-1 bg-white relative">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Page Title */}
        <Text className="text-3xl font-extrabold text-brand-500 mb-4 tracking-tight">
          Events
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-4 border border-slate-200/50">
          <Search size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Event"
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-base text-slate-800 font-medium p-0"
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-6 px-6"
        >
          <View className="flex-row gap-2 pr-6">
            {FILTER_TABS.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded-full ${
                    isActive ? "bg-brand-500" : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Event List */}
        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#0F172A" />
          </View>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={(e) => setSelectedDetailEvent(e)}
              onImagePress={(url) => setSelectedImageUrl(url)}
              onQrPress={(e) => setSelectedQrEvent(e)}
            />
          ))
        ) : (
          <View className="py-12 items-center justify-center">
            <Text className="text-base font-semibold text-slate-400">
              No events found.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Full Event Details Modal */}
      <EventDetailModal
        visible={!!selectedDetailEvent}
        event={selectedDetailEvent}
        onClose={() => setSelectedDetailEvent(null)}
        onImagePress={(url) => setSelectedImageUrl(url)}
        onQrPress={(e) => setSelectedQrEvent(e)}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        visible={!!selectedQrEvent}
        onClose={() => setSelectedQrEvent(null)}
        qrCode={selectedQrEvent?.qr_code || ""}
        qrImageUrl={selectedQrEvent?.qr_image_url}
        eventTitle={selectedQrEvent?.title}
      />

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImageUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center relative">
          <TouchableOpacity
            onPress={() => setSelectedImageUrl(null)}
            className="absolute top-12 right-6 z-50 w-10 h-10 rounded-full bg-white/20 justify-center items-center"
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {selectedImageUrl && (
            <Image
              source={{ uri: selectedImageUrl }}
              className="w-full h-5/6"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
