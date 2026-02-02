import React from "react";
import { Text, TextInput, TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label: string;
  error?: string;
};

export default function Input({ label, error, ...props }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-2 font-medium">{label}</Text>
      <TextInput
        className={`rounded-xl border px-4 py-3 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
      {!!error && <Text className="mt-2 text-red-600">{error}</Text>}
    </View>
  );
}
