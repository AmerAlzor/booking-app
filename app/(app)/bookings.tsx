import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import Input from "../../components/Input";

type BookingStatus = "PENDING" | "APPROVED" | "DENIED" | "CANCELLED";

type Booking = {
  id: string;
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm"
  partySize: number;
  status: BookingStatus;
  createdAt: string; // ISO string
  cancelledAt?: string | null;
};

function statusLabel(status: BookingStatus) {
  switch (status) {
    case "PENDING":
      return "Pågående";
    case "APPROVED":
      return "Godkänd";
    case "DENIED":
      return "Nekad";
    case "CANCELLED":
      return "Avbokad";
  }
}

function canCancel(b: Booking) {
  // Endast pending eller approved, och mindre än 24 timmar sedan skapad
  if (!(b.status === "PENDING" || b.status === "APPROVED")) return false;

  const created = new Date(b.createdAt).getTime();
  const now = Date.now();
  const hours = (now - created) / (1000 * 60 * 60);

  return hours < 24;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function BookingsScreen() {
  // Ny bokning (enkla inputs)
  const [date, setDate] = useState(""); // t.ex. 2026-02-02
  const [time, setTime] = useState(""); // t.ex. 18:30
  const [partySize, setPartySize] = useState("2");

  // UI-state
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fejk-bokningar (för utseende)
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: "b1",
      date: "2026-02-02",
      time: "18:30",
      partySize: 2,
      status: "PENDING",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h sen
    },
    {
      id: "b2",
      date: "2026-02-01",
      time: "20:00",
      partySize: 4,
      status: "APPROVED",
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h sen
    },
    {
      id: "b3",
      date: "2026-01-30",
      time: "19:00",
      partySize: 3,
      status: "DENIED",
      createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30h sen
    },
    {
      id: "b4",
      date: "2026-01-29",
      time: "17:00",
      partySize: 2,
      status: "CANCELLED",
      createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      cancelledAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const sorted = useMemo(() => {
    return [...bookings].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [bookings]);

  async function fakeRefresh() {
    setLoadingList(true);
    // bara för UI-känsla
    setTimeout(() => setLoadingList(false), 600);
  }

  async function createBookingLocal() {
    if (!date.trim()) return Alert.alert("Fyll i datum", "Ange ett datum.");
    if (!time.trim()) return Alert.alert("Fyll i tid", "Ange en tid.");
    const n = Number(partySize);
    if (!Number.isFinite(n) || n <= 0)
      return Alert.alert("Antal personer", "Ange ett giltigt antal.");

    setSubmitting(true);

    // bara för UI-känsla
    setTimeout(() => {
      const created: Booking = {
        id: makeId(),
        date,
        time,
        partySize: n,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };

      setBookings((prev) => [created, ...prev]);
      setTime("");
      setSubmitting(false);

      Alert.alert("Bokning skapad", "Din bokning är nu pågående (pending).");
    }, 500);
  }

  function cancelBookingLocal(id: string) {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status: "CANCELLED",
              cancelledAt: new Date().toISOString(),
            }
          : b,
      ),
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-4">
        <Text className="text-3xl font-bold">Bokningar</Text>
        <Text className="mt-2 text-gray-600">
          Skapa en ny bokning och se dina tidigare bokningar.
        </Text>

        {/* Ny bokning */}
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
            onPress={createBookingLocal}
          />
        </View>

        {/* Mina bokningar */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Mina bokningar</Text>
            <Pressable onPress={fakeRefresh} disabled={loadingList}>
              <Text className="text-gray-600 underline">
                {loadingList ? "Uppdaterar..." : "Uppdatera"}
              </Text>
            </Pressable>
          </View>

          <View className="h-3" />

          {sorted.length === 0 ? (
            <Text className="text-gray-600">Inga bokningar ännu.</Text>
          ) : (
            <View className="gap-3">
              {sorted.map((b) => {
                const cancellable = canCancel(b);

                return (
                  <View
                    key={b.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold">
                        {b.date} • {b.time}
                      </Text>
                      <Text className="text-gray-600">
                        {statusLabel(b.status)}
                      </Text>
                    </View>

                    <Text className="mt-1 text-gray-600">
                      Antal personer: {b.partySize}
                    </Text>

                    {/* Avbokning */}
                    <View className="mt-3">
                      <Button
                        title="Avboka"
                        variant="secondary"
                        onPress={() => {
                          if (!cancellable) return;

                          Alert.alert(
                            "Avboka bokning?",
                            "Är du säker på att du vill avboka?",
                            [
                              { text: "Nej", style: "cancel" },
                              {
                                text: "Ja, avboka",
                                style: "destructive",
                                onPress: () => cancelBookingLocal(b.id),
                              },
                            ],
                          );
                        }}
                        disabled={!cancellable}
                      />

                      {!cancellable && (
                        <Text className="mt-2 text-gray-500">
                          Du kan endast avboka om bokningen är pågående eller
                          godkänd och skapades för mindre än 24 timmar sedan.
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
