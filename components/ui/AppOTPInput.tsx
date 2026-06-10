import React, { useRef, useState } from 'react';
import {
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputKeyPressEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../theme/colors';

interface AppOTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
}

export function AppOTPInput({ value, onChange, length = 6 }: AppOTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const digits = value.split('').slice(0, length);
  while (digits.length < length) digits.push('');

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    const newValue = next.join('');
    onChange(newValue);

    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      onChange(next.join(''));
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <TouchableOpacity
          key={i}
          activeOpacity={1}
          onPress={() => inputRefs.current[i]?.focus()}
          style={[styles.cell, digits[i] ? styles.cellFilled : null, focusedIndex === i ? styles.cellFocused : null]}
        >
          <TextInput
            ref={(r) => {
              inputRefs.current[i] = r;
            }}
            style={styles.cellInput}
            value={digits[i]}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            onFocus={() => setFocusedIndex(i)}
            onBlur={() => setFocusedIndex(null)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
            caretHidden
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  cellFocused: {
    borderColor: Colors.primary,
  },
  cellFilled: {
    borderColor: Colors.primary,
    backgroundColor: '#EEF0FA',
  },
  cellInput: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
});
