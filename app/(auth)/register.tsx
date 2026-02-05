import { useRouter } from "expo-router";
import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiFetch } from "../../lib/api";
import { saveToken } from "../../lib/tokenStorage";

import Button from "../../components/Button";
import Input from "../../components/Input";

export default function RegisterScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-1 bg-white justify-center p-4">
          <Text className="text-3xl font-bold">Skapa konto</Text>
          <Text className="mt-2 text-gray-600">
            Skapa ett konto för att kunna boka.
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
            placeholder="Minst 8 tecken"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="Bekräfta lösenord"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Upprepa lösenord"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Button
            title="Skapa konto"
            onPress={async () => {
              if (password.length < 8) throw new Error("Minst 8 tecken");
              if (password !== confirm)
                throw new Error("Lösenorden matchar inte");

              const data = await apiFetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify({ email, password }),
              });

              await saveToken(data.token);
              router.replace("/");
            }}
          />

          <View className="h-3" />

          <Button
            title="Tillbaka till login"
            variant="secondary"
            onPress={() => router.back()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
