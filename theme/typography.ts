import { TextStyle } from 'react-native';
import { Colors } from './colors';

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: '500',
    color: Colors.primary,
  } as TextStyle,
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 22,
  } as TextStyle,
};
