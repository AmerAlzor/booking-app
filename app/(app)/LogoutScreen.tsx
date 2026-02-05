import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Button from "../../components/Button";
import { clearToken } from "../../lib/tokenStorage";

export default function LogoutScreen() {
  const [loggingOut, setLoggingOut] = useState(true);

  const doLogout = async () => {
    try {
      setLoggingOut(true);
      await clearToken();

      router.replace("/(auth)/login");
    } catch {
      Alert.alert("Kunde inte logga ut", "Försök igen.");
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    doLogout();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-lg font-semibold">
          {loggingOut ? "Loggar ut..." : "Utloggning misslyckades"}
        </Text>

        {!loggingOut && (
          <View className="mt-4 w-full">
            <Button title="Försök logga ut igen" onPress={doLogout} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
