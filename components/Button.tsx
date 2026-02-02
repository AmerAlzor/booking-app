import React from "react";
import { Pressable, Text } from "react-native";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
}: Props) {
  const base = "rounded-xl px-4 py-3 items-center justify-center";
  const bg = variant === "primary" ? "bg-black" : "bg-gray-200";
  const textColor = variant === "primary" ? "text-white" : "text-black";

  return (
    <Pressable
      className={`${base} ${bg} ${disabled ? "opacity-50" : ""}`}
      onPress={onPress}
      disabled={disabled}
    >
      <Text className={`font-semibold ${textColor}`}>{title}</Text>
    </Pressable>
  );
}
