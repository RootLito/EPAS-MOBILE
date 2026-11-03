// components/CustomCalendar.tsx
import { EventDetailModal } from "@/components/EventDetailModal";
import { EventPickerModal } from "@/components/EventPickerModal";
import { Event } from "@/types";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar as CalendarIcon } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
    PanResponder,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface CustomCalendarProps {
  selectedDate?: string;
  onSelectDate?: (dateString: string) => void;
  highlightedDates?: string[];
  events?: Event[];
  onEventPress?: (event: Event) => void;
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  selectedDate,
  onSelectDate,
  highlightedDates = [],
  events = [],
  onEventPress,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isSwipingRef = useRef(false);

  // Picker modal state (for 2+ events on a day)
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [pickerDateStr, setPickerDateStr] = useState<string>("");
  const [pickerEvents, setPickerEvents] = useState<Event[]>([]);

  // Detail modal state (for viewing a single event)
  const [selectedDetailEvent, setSelectedDetailEvent] = useState<Event | null>(
    null,
  );
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const handlePrevMonth = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1),
    );
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 350);
  };

  const handleNextMonth = () => {
    if (isSwipingRef.current) return;
    isSwipingRef.current = true;
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1),
    );
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 350);
  };

  // Quick navigation via native Date Picker
  const handleDatePickerChange = (
    event: DateTimePickerEvent,
    date?: Date | undefined,
  ) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      if (Platform.OS === "ios") {
        setShowDatePicker(false);
      }
      // Jump calendar to the picked month and year
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));

      // Select the picked date
      const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
      const formattedDay = String(date.getDate()).padStart(2, "0");
      const dateStr = `${date.getFullYear()}-${formattedMonth}-${formattedDay}`;

      if (onSelectDate) {
        onSelectDate(dateStr);
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 35 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          handleNextMonth();
        } else if (gestureState.dx > 50) {
          handlePrevMonth();
        }
      },
    }),
  ).current;

  const firstDay = new Date(year, month, 1).getDay();
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; currentMonth: boolean; monthOffset: number }[] =
    [];

  for (let i = paddingDays - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDays - i,
      currentMonth: false,
      monthOffset: -1,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true, monthOffset: 0 });
  }
  const remainingCells = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({ day: i, currentMonth: false, monthOffset: 1 });
  }

  const handleDayPress = (cell: (typeof cells)[0]) => {
    const targetDate = new Date(year, month + cell.monthOffset, cell.day);
    const formattedMonth = String(targetDate.getMonth() + 1).padStart(2, "0");
    const formattedDay = String(targetDate.getDate()).padStart(2, "0");
    const dateStr = `${targetDate.getFullYear()}-${formattedMonth}-${formattedDay}`;

    if (cell.monthOffset !== 0) {
      setCurrentMonth(targetDate);
    }
    if (onSelectDate) {
      onSelectDate(dateStr);
    }

    const dayEvents = events.filter((evt) => {
      if (!evt.start_date) return false;
      return evt.start_date.split("T")[0] === dateStr;
    });

    if (dayEvents.length === 1) {
      setSelectedDetailEvent(dayEvents[0]);
      setDetailModalVisible(true);
      if (onEventPress) onEventPress(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      setPickerEvents(dayEvents);
      setPickerDateStr(dateStr);
      setPickerModalVisible(true);
    }
  };

  const handlePickerSelect = (evt: Event) => {
    setPickerModalVisible(false);
    setTimeout(() => {
      setSelectedDetailEvent(evt);
      setDetailModalVisible(true);
      if (onEventPress) onEventPress(evt);
    }, 300);
  };

  return (
    <View className="w-full" {...panResponder.panHandlers}>
      {/* Month & Year Header with Calendar Jump Icon */}
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-3xl font-bold text-brand-500">
          {MONTH_NAMES[month]} {year}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowDatePicker(true)}
          className="p-2.5 rounded-2xl bg-brand-50 border border-brand-100 items-center justify-center"
        >
          <CalendarIcon size={20} color="#395886" />
        </TouchableOpacity>
      </View>

      {/* Calendar Card Container */}
      <View className="bg-brand-500 rounded-3xl p-4">
        {/* Weekdays Header */}
        <View className="flex-row justify-between mb-2">
          {WEEKDAYS.map((day, idx) => (
            <Text
              key={idx}
              className="w-[14.28%] text-center text-sm font-extrabold text-white/80"
            >
              {day}
            </Text>
          ))}
        </View>

        <View className="h-[1px] bg-white/20 mb-4" />

        {/* Grid */}
        <View className="flex-row flex-wrap">
          {cells.map((cell, idx) => {
            const targetDate = new Date(
              year,
              month + cell.monthOffset,
              cell.day,
            );
            const formattedMonth = String(targetDate.getMonth() + 1).padStart(
              2,
              "0",
            );
            const formattedDay = String(targetDate.getDate()).padStart(2, "0");
            const dateStr = `${targetDate.getFullYear()}-${formattedMonth}-${formattedDay}`;

            const isSelected = selectedDate === dateStr;
            const isEventDay =
              highlightedDates.includes(dateStr) ||
              events.some((e) => e.start_date?.startsWith(dateStr));

            let circleStyle = "";
            if (isSelected) {
              circleStyle = "bg-white";
            } else if (isEventDay && cell.currentMonth) {
              circleStyle = "bg-white/20";
            }

            return (
              <View key={idx} className="w-[14.28%] aspect-square p-1">
                <TouchableOpacity
                  onPress={() => handleDayPress(cell)}
                  className={`w-full h-full justify-center items-center rounded-full ${circleStyle}`}
                >
                  <Text
                    className={`text-base font-semibold ${
                      isSelected
                        ? "text-brand-500 font-bold"
                        : isEventDay && cell.currentMonth
                          ? "text-white font-bold"
                          : cell.currentMonth
                            ? "text-white"
                            : "text-white/40"
                    }`}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </View>

      {/* Date Picker Modal for quick navigation */}
      {showDatePicker && (
        <DateTimePicker
          value={currentMonth}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleDatePickerChange}
        />
      )}

      {/* Centered Picker Modal for 2+ events */}
      <EventPickerModal
        visible={pickerModalVisible}
        dateString={pickerDateStr}
        events={pickerEvents}
        onClose={() => setPickerModalVisible(false)}
        onSelectEvent={handlePickerSelect}
      />

      {/* Event Details Modal */}
      <EventDetailModal
        visible={detailModalVisible}
        event={selectedDetailEvent}
        onClose={() => setDetailModalVisible(false)}
      />
    </View>
  );
};
