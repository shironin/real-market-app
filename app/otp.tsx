import { getAuth, signInWithCustomToken } from '@react-native-firebase/auth';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../components/ui/AppButton';
import { AppOTPInput } from '../components/ui/AppOTPInput';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

const REGION = 'europe-central2';

export default function OTPScreen() {
  const { t } = useLanguage();
  const { phone, verificationId: initialVerificationId } =
    useLocalSearchParams<{ phone: string; verificationId: string; isNewUser: string }>();

  const [verificationId, setVerificationId] = useState(initialVerificationId);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = () => {
    clearInterval(intervalRef.current!);
    setCountdown(60);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(intervalRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    startCountdown();
    return () => clearInterval(intervalRef.current!);
  }, []);

  const handleResend = async () => {
    setError('');
    try {
      const result = await httpsCallable(getFunctions(undefined, REGION), 'sendOtp')({ phoneNumber: phone });
      const { verificationId: newId } = result.data as { verificationId: string; isNewUser: boolean };
      setVerificationId(newId);
      setCode('');
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6 || loading) return;
    setLoading(true);
    setError('');
    console.log('[OTP] verifyOtp payload:', { verificationId, otp: code });
    try {
      const result = await httpsCallable(getFunctions(undefined, REGION), 'verifyOtp')({ verificationId, otp: code });
      const { customToken } = result.data as { customToken: string };
      await signInWithCustomToken(getAuth(), customToken);
      // _layout.tsx auth guard handles navigation based on profile completeness
    } catch (err: unknown) {
      console.error(err);
      const msg = err instanceof Error ? err.message : t('errors.generic');
      setError(msg.includes('Incorrect') ? t('errors.invalidOtp') : msg);
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
          <Text style={Typography.title}>{t('otp.title')}</Text>
          <Text style={Typography.subtitle}>
            {t('otp.subtitle')}{'\n'}
            <Text style={styles.phone}>{phone}</Text>
          </Text>

          <View style={styles.otpWrapper}>
            <AppOTPInput value={code} onChange={(v) => { setCode(v); setError(''); }} length={6} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>
              {t('otp.resendIn').replace('{{seconds}}', String(countdown))}
            </Text>
          ) : (
            <TouchableOpacity style={styles.resend} onPress={handleResend}>
              <Text style={styles.resendText}>{t('otp.resend')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <AppButton
          title={t('otp.verify')}
          onPress={handleVerify}
          disabled={code.length !== 6}
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
  phone: {
    color: Colors.primary,
    fontWeight: '700',
  },
  otpWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  error: {
    fontSize: 13,
    color: Colors.error,
  },
  resend: {
    paddingVertical: 8,
  },
  resendCountdown: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
