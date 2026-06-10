import { router } from 'expo-router';
import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/ui/AppButton';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';
import { Colors } from '../theme/colors';

const welcomeBg = require('../assets/images/welcome-bg.png');
const logoImg = require('../assets/images/logo.png');
const logoTextImg = require('../assets/images/logo-text.png');

export default function WelcomeScreen() {
  const { t } = useLanguage();

  return (
    <ImageBackground source={welcomeBg} style={styles.bg} resizeMode="cover">
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <LanguageSwitcher />
        </View>

        <View style={styles.content}>
          <View style={styles.heroSection}>
            <Image source={logoImg} style={styles.logo} resizeMode="contain" />
            <Image source={logoTextImg} style={styles.logoText} resizeMode="contain" />
          </View>

          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
        </View>

        <View style={styles.footer}>
          <AppButton
            title={t('welcome.start')}
            onPress={() => router.push('/enter-number')}
          />
          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>{t('welcome.disclaimerText')}</Text>
            <Text style={styles.disclaimerLink}>{t('welcome.disclaimerLink')}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 8,
  },
  heroSection: {
    paddingTop: 48,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 28,
  },
  logo: {
    width: 80,
    height: 80,
  },
  logoText: {
    height: 80
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary,
    lineHeight: 24,
    fontWeight: '400',
    textAlign: 'center',
  },
  footer: {
    gap: 12,
  },
  disclaimer: {},
  disclaimerText: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.primary,
  },
  disclaimerLink: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.primary,
    textDecorationLine: 'underline',
    textDecorationStyle: 'solid',
    textDecorationColor: Colors.primary,
  },
});
