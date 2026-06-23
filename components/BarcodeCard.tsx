import { Ionicons } from '@expo/vector-icons';
import * as Brightness from 'expo-brightness';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';

const EAN13_L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
const EAN13_G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
const EAN13_R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
const EAN13_PARITY = ['LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'];

function ean13Checksum(d: number[]): number {
  const sum = d.reduce((s, n, i) => s + n * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

function ean13Binary(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  let d: number[];
  if (digits.length === 12) {
    d = digits.split('').map(Number);
    d.push(ean13Checksum(d));
  } else if (digits.length === 13) {
    // Trust the API-issued number; don't reject based on checksum
    d = digits.split('').map(Number);
  } else {
    return null;
  }
  const parity = EAN13_PARITY[d[0]];
  let bin = '101';
  for (let i = 0; i < 6; i++) bin += parity[i] === 'L' ? EAN13_L[d[i + 1]] : EAN13_G[d[i + 1]];
  bin += '01010';
  for (let i = 7; i < 13; i++) bin += EAN13_R[d[i]];
  bin += '101';
  return bin; // 95 modules
}

interface BarcodeCardProps {
  cardNumber?: string;
  holderName?: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function EAN13Barcode({ value, width, height }: { value: string; width: number; height: number }) {
  const binary = ean13Binary(value);
  if (!binary) return null;
  const moduleW = width / binary.length;
  const rects: React.ReactElement[] = [];
  let i = 0;
  while (i < binary.length) {
    if (binary[i] === '1') {
      let j = i + 1;
      while (j < binary.length && binary[j] === '1') j++;
      rects.push(<Rect key={i} x={i * moduleW} y={0} width={(j - i) * moduleW} height={height} fill="#1A1A2E" />);
      i = j;
    } else {
      i++;
    }
  }
  return <Svg width={width} height={height}>{rects}</Svg>;
}

export function BarcodeCard({
  cardNumber = '1234567890128',
  holderName,
  isLoading = false,
  error = null,
  onRetry,
}: BarcodeCardProps) {
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const savedBrightness = useRef<number | null>(null);

  const rawCardNumber = (cardNumber ?? '').replace(/\D/g, '');

  useEffect(() => {
    if (modalVisible) {
      Brightness.getBrightnessAsync().then((value) => {
        savedBrightness.current = value;
        Brightness.setBrightnessAsync(1);
      });
    } else if (savedBrightness.current !== null) {
      Brightness.setBrightnessAsync(savedBrightness.current);
      savedBrightness.current = null;
    }
  }, [modalVisible]);

  // Barcode is rendered at full portrait-width, then rotated 90° to appear horizontal.
  // After rotation: visual width = barcodeHeight, visual height = barcodeWidth.
  // We want visual width = screenWidth, so barcodeHeight = screenWidth.
  // We want visual height ≈ 40% of screenHeight, so barcodeWidth = screenHeight * 0.4.
  const fsBarWidth = screenHeight * 0.82;
  const fsBarHeight = screenWidth * 0.42;

  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('card.title')}</Text>
        </View>
        <View style={styles.barcodeWrapper}>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('card.title')}</Text>
        </View>
        <View style={styles.errorWrapper}>
          <Ionicons name="alert-circle-outline" size={32} color={Colors.surface} />
          <Text style={styles.errorText}>{t('card.loadError')}</Text>
          {onRetry && (
            <Pressable style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryText}>{t('card.retry')}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable style={styles.card} onPress={() => setModalVisible(true)}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{t('card.title')}</Text>
          <Pressable style={styles.expand} onPress={(e) => { e.stopPropagation(); setModalVisible(true); }} hitSlop={10}>
            <Ionicons name="expand-outline" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.holderName}>{holderName || t('card.defaultHolder')}</Text>

        <View style={styles.barcodeWrapper}>
          <EAN13Barcode value={rawCardNumber} width={280} height={60} />
          <Text style={styles.cardNumber}>{cardNumber}</Text>
        </View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Pressable style={styles.closeButton} onPress={() => setModalVisible(false)} hitSlop={12}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>

            <View
              style={[
                styles.rotatedBarcodeContainer,
                {
                  width: fsBarWidth,
                  height: fsBarHeight,
                  marginLeft: -(fsBarWidth - fsBarHeight) / 2,
                  marginRight: -(fsBarWidth - fsBarHeight) / 2,
                },
              ]}
            >
              <View style={styles.barcodeInner}>
                <EAN13Barcode value={rawCardNumber} width={fsBarWidth - 40} height={fsBarHeight - 60} />
                <Text style={styles.fsCardNumber}>{cardNumber}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(39,48,107,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '300',
    color: Colors.surface,
  },
  expand: {
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 20,
  },
  holderName: {
    fontSize: 22,
    color: Colors.surface,
    marginBottom: 12,
  },
  barcodeWrapper: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 6,
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
  loader: {
    marginVertical: 24,
  },
  errorWrapper: {
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  errorText: {
    color: Colors.surface,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.85,
  },
  retryButton: {
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 24,
    backgroundColor: Colors.surface,
    borderRadius: 20,
  },
  retryText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  rotatedBarcodeContainer: {
    transform: [{ rotate: '90deg' }],
  },
  barcodeInner: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fsCardNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
  },
});
