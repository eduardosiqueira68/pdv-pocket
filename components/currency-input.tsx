import React, { useState, useCallback } from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import { formatCents } from "@/lib/db/database";

interface CurrencyInputProps {
  value: number; // cents
  onChangeValue: (cents: number) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  autoFocus?: boolean;
}

export function CurrencyInput({
  value,
  onChangeValue,
  placeholder = "R$ 0,00",
  label,
  className,
  autoFocus,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState(value > 0 ? formatCentsInput(value) : "");

  const handleChange = useCallback(
    (text: string) => {
      const digits = text.replace(/\D/g, "");
      const cents = parseInt(digits, 10) || 0;
      setDisplayValue(formatCentsInput(cents));
      onChangeValue(cents);
    },
    [onChangeValue]
  );

  return (
    <View className={className}>
      {label && <Text className="text-sm font-medium text-foreground mb-1">{label}</Text>}
      <TextInput
        style={styles.input}
        className="bg-surface border border-border rounded-xl px-4 py-3 text-lg text-foreground"
        value={displayValue}
        onChangeText={handleChange}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        autoFocus={autoFocus}
        returnKeyType="done"
      />
    </View>
  );
}

function formatCentsInput(cents: number): string {
  if (cents === 0) return "";
  const str = cents.toString().padStart(3, "0");
  const reais = str.slice(0, -2);
  const centavos = str.slice(-2);
  return `R$ ${reais},${centavos}`;
}

const styles = StyleSheet.create({
  input: {
    fontSize: 18,
  },
});
