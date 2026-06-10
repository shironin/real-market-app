import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { Colors } from '../theme/colors';

function RootNavigation() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (!profile?.firstName) {
      router.replace('/profile-edit?onboarding=true');
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }, [user, profile, loading]);

  if (loading) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="enter-number" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="profile-edit" />
      <Stack.Screen name="policy" />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigation />
      </AuthProvider>
    </LanguageProvider>
  );
}
