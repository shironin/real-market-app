import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/ui/AppButton';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { PhoneInput } from '../components/ui/PhoneInput';
import { useLanguage } from '../i18n/LanguageContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function EnterNumberScreen() {
  const { t } = useLanguage();
  const [countryCode, setCountryCode] = useState('+373');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = phoneDigits.length >= 8;

  const handleSend = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const phoneNumber = `${countryCode}${phoneDigits}`;
      const result = await httpsCallable(getFunctions(undefined, 'europe-central2'), 'sendOtp')({ phoneNumber });
      const { verificationId, isNewUser } = result.data as {
        verificationId: string;
        isNewUser: boolean;
      };
      console.log('[sendOtp] verificationId:', verificationId);
      router.push({
        pathname: '/otp',
        params: { phone: phoneNumber, verificationId, isNewUser: String(isNewUser) },
      });
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>{t('enterNumber.back')}</Text>
          </TouchableOpacity>
          <LanguageSwitcher />
        </View>

        <View style={styles.content}>
          <Text style={Typography.title}>{t('enterNumber.title')}</Text>
          <Text style={Typography.subtitle}>{t('enterNumber.subtitle')}</Text>

          <View style={styles.form}>
            <PhoneInput
              label={t('enterNumber.phoneLabel')}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              value={phoneDigits}
              onChangeText={(v) => { setPhoneDigits(v); setError(''); }}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>

        <AppButton
          title={t('enterNumber.sendCode')}
          onPress={handleSend}
          disabled={!isValid}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginBottom: 32,
  },
  back: {
    paddingTop: 8,
    paddingBottom: 16,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    gap: 16,
  },
  form: {
    gap: 8,
  },
  error: {
    fontSize: 13,
    color: Colors.error,
  },
});
