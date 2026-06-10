import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Colors } from '../../theme/colors';

// Formats up to 8 raw digits as "XX XXX XXX"
function applyMask(digits: string): string {
  const d = digits.slice(0, 8);
  let result = d.slice(0, 2);
  if (d.length > 2) result += ' ' + d.slice(2, 5);
  if (d.length > 5) result += ' ' + d.slice(5, 8);
  return result;
}

interface PhoneInputProps {
  label?: string;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  value: string; // raw digits only, max 8
  onChangeText: (digits: string) => void;
}

export function PhoneInput({
  label,
  countryCode = '+373',
  onCountryCodeChange,
  value,
  onChangeText,
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const numberRef = useRef<TextInput>(null);

  const handleCountryCodeChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, 3);
    onCountryCodeChange?.('+' + digits);
  };

  const handleNumberChange = (text: string) => {
    onChangeText(text.replace(/\D/g, '').slice(0, 8));
  };

  // TextInput value is always the masked string; cursor lands at end naturally
  const displayValue = applyMask(value);

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableWithoutFeedback onPress={() => numberRef.current?.focus()}>
        <View style={[styles.container, isFocused && styles.containerFocused]}>
          <TextInput
            style={styles.countryCode}
            value={countryCode}
            onChangeText={handleCountryCodeChange}
            placeholder="+373"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="phone-pad"
            maxLength={4}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            selectionColor={Colors.primary}
            readOnly={true}
          />

          <View style={styles.divider} />

          <TextInput
            ref={numberRef}
            style={styles.numberInput}
            value={displayValue}
            onChangeText={handleNumberChange}
            placeholder="60 000 000"
            placeholderTextColor={Colors.textPlaceholder}
            keyboardType="phone-pad"
            autoFocus
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            selectionColor={Colors.primary}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  containerFocused: {
    borderColor: Colors.borderFocused,
  },
  countryCode: {
    width: 80,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.text,
    textAlign: 'center',
  },
  divider: {
    width: 1.5,
    height: 24,
    backgroundColor: Colors.border,
  },
  numberInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.text,
  },
});
