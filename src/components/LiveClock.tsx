import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, "0");
  const seconds = String(currentTime.getSeconds()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;
  const formattedHours = String(hours).padStart(2, "0");

  const dateString = currentTime
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase();

  return (
    <View className="items-center mb-8">
      <View className="flex-row items-baseline">
        <Text className="text-5xl font-black text-brand-500 tracking-wider">
          {formattedHours}:{minutes}:{seconds}
        </Text>
        <Text className="text-2xl font-extrabold text-brand-500 ml-1">
          {ampm}
        </Text>
      </View>
      <Text className="text-sm font-bold text-slate-400 tracking-widest mt-1">
        {dateString}
      </Text>
    </View>
  );
}
