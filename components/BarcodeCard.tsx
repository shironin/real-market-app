import { Ionicons } from '@expo/vector-icons';
import * as Brightness from 'expo-brightness';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { Colors } from '../theme/colors';

interface BarcodeCardProps {
  cardNumber?: string;
  holderName?: string;
}

const BAR_WIDTHS = [
  2, 1, 3, 1, 2, 1, 1, 2, 1, 2, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2,
  1, 1, 2, 1, 3, 2, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 1,
  2, 1, 1, 2, 1, 2, 3, 1, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3,
  1, 2, 1, 1, 2, 1, 1, 3, 2, 1,
];

function Barcode({ width, height }: { value: string; width: number; height: number }) {
  const totalUnits = BAR_WIDTHS.reduce((a, b) => a + b, 0);
  const scale = width / totalUnits;

  const bars: { x: number; w: number; isBlack: boolean }[] = [];
  let x = 0;
  BAR_WIDTHS.forEach((units, i) => {
    bars.push({ x, w: units * scale, isBlack: i % 2 === 0 });
    x += units * scale;
  });

  return (
    <Svg width={width} height={height}>
      {bars.map((bar, i) =>
        bar.isBlack ? (
          <Rect key={i} x={bar.x} y={0} width={bar.w} height={height} fill="#1A1A2E" />
        ) : null
      )}
    </Svg>
  );
}


export function BarcodeCard({
  cardNumber = '1234 5678 9012 3456',
  holderName = 'Участник',
}: BarcodeCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const savedBrightness = useRef<number | null>(null);

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

  return (
    <>
      <Pressable style={styles.card} onPress={() => setModalVisible(true)}>
        <View style={styles.header}>
          <Text style={styles.headerText}>CARD DE REDUCERE</Text>
          <Pressable style={styles.expand} onPress={(e) => { e.stopPropagation(); setModalVisible(true); }} hitSlop={10}>
            <Ionicons name="expand-outline" size={20} color={Colors.primary} />
          </Pressable>
        </View>

        <Text style={styles.holderName}>{holderName}</Text>

        <View style={styles.barcodeWrapper}>
          <Barcode value={cardNumber} width={280} height={72} />
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
                <Barcode value={cardNumber} width={fsBarWidth - 32} height={fsBarHeight - 32} />
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
    fontSize: 14,
    fontWeight: '300',
    color: Colors.surface,
  },
  expand: {
    backgroundColor: Colors.surface,
    padding: 8,
    borderRadius: 20,
  },
  holderName: {
    fontSize: 26,
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
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    marginTop: 8,
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
