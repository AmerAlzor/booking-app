import { useFocusEffect, useRoute } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/Button";
import { apiFetch } from "../../lib/api";
import { getToken } from "../../lib/tokenStorage";
import {
    Booking,
    canCancel,
    cancelReason,
    formatDateTime,
    statusLabel,
} from "./bookingUtils";

type NotificationDto = {
  id: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};

export default function MyBookingsScreen() {
  const route = useRoute<any>();

  const [token, setToken] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showingNotificationId, setShowingNotificationId] = useState<
    string | null
  >(null);

  const showingNotificationIdRef = useRef<string | null>(null);
  useEffect(() => {
    showingNotificationIdRef.current = showingNotificationId;
  }, [showingNotificationId]);

  useEffect(() => {
    (async () => setToken(await getToken()))();
  }, []);

  async function loadBookings() {
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
  }

  async function cancelBooking(b: Booking) {
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
  }

  async function checkNotifications() {
    if (!token) return;

    try {
      const data = (await apiFetch("/api/notifications", {
        method: "GET",
      })) as { notifications: NotificationDto[] };

      const unread = data.notifications.find((n) => !n.readAt);
      if (!unread) return;

      if (showingNotificationIdRef.current === unread.id) return;

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
            } finally {
              setShowingNotificationId(null);
              loadBookings();
            }
          },
        },
      ]);
    } catch {}
  }

  useFocusEffect(
    React.useCallback(() => {
      if (!token) return;
      loadBookings();
    }, [token]),
  );

  useEffect(() => {
    if (!token) return;
    if (route?.params?.refresh) loadBookings();
  }, [route?.params?.refresh, token]);

  useEffect(() => {
    if (!token) return;

    checkNotifications();
    const interval = setInterval(() => {
      checkNotifications();
    }, 2000);

    return () => clearInterval(interval);
  }, [token]);

  const sorted = [...bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <ScrollView className="flex-1">
        <Text className="text-3xl font-bold">Bokningar</Text>

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

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
