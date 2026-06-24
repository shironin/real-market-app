import { getFunctions, httpsCallable } from '@react-native-firebase/functions';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { AppButton } from '../components/ui/AppButton';
import { AppInput } from '../components/ui/AppInput';
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher';
import { useLanguage } from '../i18n/LanguageContext';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

export default function ProfileEditScreen() {
  const { t } = useLanguage();
  const { profile, updateProfile } = useAuth();
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';

  useFocusEffect(
    useCallback(() => {
      if (!isOnboarding) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [isOnboarding])
  );

  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleSave = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    setError('');
    try {
      const trimmed = { firstName: firstName.trim(), lastName: lastName.trim() };
      await httpsCallable(getFunctions(undefined, 'europe-central2'), 'updateProfile')(trimmed);
      updateProfile(trimmed);
      router.replace('/(tabs)/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('errors.generic'));
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Stack.Screen options={{ gestureEnabled: !isOnboarding }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            {!isOnboarding ? (
              <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                <Text style={styles.backText}>{t('enterNumber.back')}</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <LanguageSwitcher />
          </View>

          <View style={styles.content}>
            <Text style={Typography.title}>{t('profileEdit.title')}</Text>
            <Text style={Typography.subtitle}>{t('profileEdit.subtitle')}</Text>

            <View style={styles.form}>
              <AppInput
                label={t('profileEdit.firstNameLabel')}
                value={firstName}
                onChangeText={(v) => { setFirstName(v); setError(''); }}
                placeholder={t('profileEdit.firstNamePlaceholder')}
                autoCapitalize="words"
                autoFocus
                returnKeyType="next"
              />
              <AppInput
                label={t('profileEdit.lastNameLabel')}
                value={lastName}
                onChangeText={(v) => { setLastName(v); setError(''); }}
                placeholder={t('profileEdit.lastNamePlaceholder')}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <AppButton
            title={t('profileEdit.save')}
            onPress={handleSave}
            loading={loading}
            disabled={!isValid}
          />
        </View>
      </KeyboardAvoidingView>
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
  scroll: {
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
    gap: 16,
  },
  error: {
    fontSize: 13,
    color: Colors.error,
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 20,
    paddingTop: 12,
  },
});
