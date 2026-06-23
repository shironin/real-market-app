import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarcodeCard } from '../../components/BarcodeCard';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useCard } from '../../context/CardContext';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { LanguageSwitcher } from "../../components/ui/LanguageSwitcher";

const logoImg = require('../../assets/images/logo.png');
const logoTextImg = require('../../assets/images/logo-text.png');

function DashboardHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.logoRow}>
        <Image source={logoImg} style={styles.logo} resizeMode="contain" />
        <Image source={logoTextImg} style={styles.logoText} resizeMode="contain" />
      </View>
      <LanguageSwitcher />
    </View>
  );
}

export default function DashboardScreen() {
  const { t } = useLanguage();
  const { profile } = useAuth();
  const { card, loading, error, refreshCard } = useCard();

  useFocusEffect(
    useCallback(() => {
      refreshCard();
    }, [refreshCard]),
  );

  const holderName = card?.client_name
    ?? [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <DashboardHeader />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <BarcodeCard
          cardNumber={card?.card_number}
          holderName={holderName}
          isLoading={loading}
          error={error}
          onRetry={refreshCard}
        />

        <Text style={styles.sectionSubtitle}>{t('dashboard.cardSubtitle')}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: Colors.background,
  },
  logoRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  logo: {
    width: 36,
    height: 36,
  },
  logoText: {
    height: 30,
    width: 80
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  sectionSubtitle: {
    ...Typography.subtitle,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
});
