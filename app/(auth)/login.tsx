import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/api";
import { saveToken } from "../../lib/tokenStorage";

import Button from "../../components/Button";
import Input from "../../components/Input";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 bg-white justify-center p-4">
          <Text className="text-3xl font-bold">Logga in</Text>
          <Text className="mt-2 text-gray-600">
            Välkommen tillbaka — logga in för att fortsätta.
          </Text>

          <View className="h-6" />

          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="du@exempel.se"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Lösenord"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="Logga in"
            onPress={async () => {
              const data = await apiFetch("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
              });
              await saveToken(data.token);
              router.replace("/(app)/bookingsTab");
            }}
          />

          <View className="h-3" />

          <Button
            title="Skapa konto"
            variant="secondary"
            onPress={() => router.push("/(auth)/register")}
          />

          <View className="h-4" />

          <Pressable onPress={() => {}}>
            <Text className="text-center text-gray-500 underline">
              Glömt lösenord?
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
