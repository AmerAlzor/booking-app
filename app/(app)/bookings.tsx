/*import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/Button";
import Input from "../../components/Input";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/tokenStorage";

type BookingStatus = "pending" | "approved" | "denied" | "cancelled";

type Booking = {
  id: string;
  dateTimeISO: string;
  partySize: number;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
};

type NotificationDto = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

function statusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Pågående";
    case "approved":
      return "Godkänd";
    case "denied":
      return "Nekad";
    case "cancelled":
      return "Avbokad";
  }
}

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function canCancel(b: Booking) {
  if (!(b.status === "pending" || b.status === "approved")) return false;
  return hoursSince(b.createdAt) < 24;
}

function cancelReason(b: Booking) {
  if (b.status === "denied" || b.status === "cancelled") {
    return "Bokningen kan inte avbokas i detta läge.";
  }
  if (hoursSince(b.createdAt) >= 24) {
    return "Du kan bara avboka inom 24 timmar från att bokningen skapades.";
  }
  return "Du kan endast avboka om bokningen är pågående eller godkänd.";
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function BookingsScreen() {
  const [token, setToken] = useState<string | null>(null);

  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:mm
  const [partySize, setPartySize] = useState("2");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showingNotificationId, setShowingNotificationId] = useState<
    string | null
  >(null);

  const checkNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const data = (await apiFetch("/api/notifications", {
        method: "GET",
      })) as { notifications: NotificationDto[] };

      const unread = data.notifications.find((n) => !n.readAt);
      if (!unread) return;

      // undvik spam (samma notis om och om igen)
      if (showingNotificationId === unread.id) return;

      setShowingNotificationId(unread.id);

      Alert.alert(unread.title, unread.message, [
        {
          text: "OK",
          onPress: async () => {
            try {
              await apiFetch(`/api/notifications/${unread.id}/read`, {
                method: "POST",
              });
            } catch {
              // ignorera
            } finally {
              setShowingNotificationId(null);
            }
          },
        },
      ]);
    } catch {
      // inga alerts på fel – polling ska vara tyst
    }
  }, [token, showingNotificationId]);

  useEffect(() => {
    if (!token) return;

    // kör direkt när screen öppnas
    checkNotifications();

    const interval = setInterval(() => {
      checkNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [token, checkNotifications]);

  // Läs token när skärmen mountar
  useEffect(() => {
    (async () => {
      const t = await getToken();
      setToken(t);
    })();
  }, []);

  const sorted = useMemo(() => {
    return [...bookings].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [bookings]);

  const loadBookings = useCallback(async () => {
    if (!token) return;

    setLoadingList(true);
    try {
      const data = (await apiFetch("/api/bookings", { method: "GET" })) as {
        bookings: Booking[];
      };
      setBookings(data.bookings);
    } catch (e: any) {
      Alert.alert("Kunde inte hämta bokningar", e?.message ?? "Okänt fel");
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) loadBookings();
    else setBookings([]);
  }, [token, loadBookings]);

  const createBooking = useCallback(async () => {
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
      const data = (await apiFetch("/api/bookings", {
        method: "POST",
        body: JSON.stringify({ dateTimeISO, partySize: n }),
      })) as { booking: Booking };

      setBookings((prev) => [data.booking, ...prev]);
      setTime("");
      Alert.alert(
        "Bokning skapad",
        "Status är pågående (pending) tills admin hanterar den.",
      );
    } catch (e: any) {
      Alert.alert("Kunde inte skapa bokning", e?.message ?? "Okänt fel");
    } finally {
      setSubmitting(false);
    }
  }, [token, date, time, partySize]);

  const cancelBooking = useCallback(
    async (b: Booking) => {
      if (!token) return;
      if (!canCancel(b)) return Alert.alert("Kan inte avboka", cancelReason(b));

      setCancellingId(b.id);
      try {
        const data = (await apiFetch(`/api/bookings/${b.id}/cancel`, {
          method: "POST",
        })) as { booking: Booking };

        setBookings((prev) =>
          prev.map((x) => (x.id === b.id ? data.booking : x)),
        );
      } catch (e: any) {
        Alert.alert("Kunde inte avboka", e?.message ?? "Okänt fel");
      } finally {
        setCancellingId(null);
      }
    },
    [token],
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1">
        <Text className="text-3xl font-bold">Bokningar</Text>
        <Text className="mt-2 text-gray-600">
          Skapa en ny bokning och se dina tidigare bokningar.
        </Text>

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

        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Mina bokningar</Text>
            <Pressable onPress={loadBookings} disabled={loadingList || !token}>
              <Text className="text-gray-600 underline">
                {loadingList ? "Uppdaterar..." : "Uppdatera"}
              </Text>
            </Pressable>
          </View>

          <View className="h-3" />

          {!token ? (
            <Text className="text-gray-600">
              Logga in för att se dina bokningar.
            </Text>
          ) : sorted.length === 0 ? (
            <Text className="text-gray-600">Inga bokningar ännu.</Text>
          ) : (
            <View className="gap-3">
              {sorted.map((b) => {
                const dt = formatDateTime(b.dateTimeISO);
                const cancellable = canCancel(b);
                const isCancelling = cancellingId === b.id;

                return (
                  <View
                    key={b.id}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="font-semibold">
                        {dt.date} • {dt.time}
                      </Text>
                      <Text className="text-gray-600">
                        {statusLabel(b.status)}
                      </Text>
                    </View>

                    <Text className="mt-1 text-gray-600">
                      Antal personer: {b.partySize}
                    </Text>

                    <View className="mt-3">
                      <Button
                        title={isCancelling ? "Avbokar..." : "Avboka"}
                        variant="secondary"
                        onPress={() => {
                          if (!cancellable) {
                            Alert.alert("Kan inte avboka", cancelReason(b));
                            return;
                          }

                          Alert.alert(
                            "Avboka bokning?",
                            "Är du säker på att du vill avboka?",
                            [
                              { text: "Nej", style: "cancel" },
                              {
                                text: "Ja, avboka",
                                style: "destructive",
                                onPress: () => cancelBooking(b),
                              },
                            ],
                          );
                        }}
                        disabled={!cancellable || isCancelling}
                      />

                      {!cancellable && (
                        <Text className="mt-2 text-gray-500">
                          {cancelReason(b)}
                        </Text>
                      )}

                      {b.status === "cancelled" && b.cancelledAt && (
                        <Text className="mt-2 text-gray-500">
                          Avbokad: {new Date(b.cancelledAt).toLocaleString()}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}*/
