import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';

interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SelectButtonProps<T extends string = string> {
  options: SelectOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SelectButton<T extends string = string>({
  options,
  value,
  onChange,
}: SelectButtonProps<T>) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const selected = option.value === value;

        return (
          <TouchableOpacity
            key={option.value}
            activeOpacity={0.8}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              selected && styles.optionSelected,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 32,
    backgroundColor: Colors.border,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    padding: 4
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionSelected: {
    backgroundColor: Colors.primary,
    borderRadius: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  labelSelected: {
    color: Colors.white,
  },
});
