import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/Button";
import Input from "../../components/Input";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/tokenStorage";

export default function CreateBookingScreen() {
  const navigation = useNavigation<any>();

  const [token, setToken] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState("2");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => setToken(await getToken()))();
  }, []);

  const createBooking = async () => {
    if (!token)
      return Alert.alert("Inte inloggad", "Logga in för att skapa bokning.");

    const d = date.trim();
    const t = time.trim();
    const n = Number(partySize);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      return Alert.alert("Datumformat", "Använd formatet YYYY-MM-DD.");
    }
    if (!/^\d{2}:\d{2}$/.test(t)) {
      return Alert.alert("Tidsformat", "Använd formatet HH:mm.");
    }
    if (!Number.isFinite(n) || n <= 0) {
      return Alert.alert("Antal personer", "Ange ett giltigt antal.");
    }

    const [yy, mm, dd] = d.split("-").map(Number);
    const [hh, min] = t.split(":").map(Number);
    const local = new Date(yy, mm - 1, dd, hh, min, 0, 0);
    const dateTimeISO = local.toISOString();

    setSubmitting(true);
    try {
      await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ dateTimeISO, partySize: n }),
      });

      setTime("");
      Alert.alert(
        "Bokning skapad",
        "Status är pågående (pending) tills admin hanterar den.",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("Mina bokningar", { refresh: Date.now() });
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert("Kunde inte skapa bokning", e?.message ?? "Okänt fel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <ScrollView className="flex-1">
        <Text className="text-3xl font-bold"> Hej! Skapa en ny bokning</Text>

        <View className="mt-6 rounded-2xl border border-gray-200 p-4">
          <Text className="text-lg font-semibold">Ny bokning</Text>
          <Text className="mt-1 text-gray-600">
            Status blir pågående (pending) tills admin hanterar den.
          </Text>

          <View className="h-4" />

          <Input
            label="Datum"
            value={date}
            onChangeText={setDate}
            placeholder="YYYY-MM-DD"
          />
          <Input
            label="Tid"
            value={time}
            onChangeText={setTime}
            placeholder="HH:mm"
          />
          <Input
            label="Antal personer"
            value={partySize}
            onChangeText={setPartySize}
            placeholder="t.ex. 2"
            keyboardType="number-pad"
          />

          <Button
            title={submitting ? "Skapar..." : "Skapa bokning"}
            onPress={createBooking}
            disabled={!token || submitting}
          />

          {!token && (
            <Text className="mt-2 text-gray-500">
              Logga in för att kunna skapa en bokning.
            </Text>
          )}
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
