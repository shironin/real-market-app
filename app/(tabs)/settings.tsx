import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { Colors } from '../../theme/colors';
import { Typography } from '../../theme/typography';

interface SettingsRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ label, value, onPress, destructive }: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>
        {label}
      </Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Text style={styles.rowChevron}>›</Text> : null}
    </TouchableOpacity>
  );
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useLanguage();
  const { profile, signOut } = useAuth();

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  const initials = [profile?.firstName?.[0], profile?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>{t('settings.title')}</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || '—'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{fullName || '—'}</Text>
            <Text style={styles.profilePhone}>{profile?.phoneNumber ?? ''}</Text>
          </View>
        </View>

        <SettingsSection title={t('settings.account')}>
          <SettingsRow
            label={t('settings.editProfile')}
            onPress={() => router.push('/profile-edit')}
          />
          <View style={styles.separator} />
          <SettingsRow label={t('settings.myNumber')} value={profile?.phoneNumber ?? ''} />
        </SettingsSection>

        <SettingsSection title={t('settings.card')}>
          <SettingsRow label={t('settings.cardNumber')} value="1234 5678 9012 3456" />
          <View style={styles.separator} />
          <SettingsRow label={t('settings.discount')} value="5%" />
        </SettingsSection>

        <SettingsSection title={t('settings.other')}>
          <SettingsRow label={t('settings.appVersion')} value={Constants.expoConfig?.version ?? '—'} />
          <View style={styles.separator} />
          <SettingsRow label={t('settings.privacyPolicy')} onPress={() => router.push('/policy')} />
        </SettingsSection>

        <SettingsSection title={t('settings.dangerZone')}>
          <SettingsRow label={t('settings.logout')} onPress={handleSignOut} destructive />
          <View style={styles.separator} />
          <SettingsRow label={t('settings.deleteData')} onPress={() => {}} destructive />
        </SettingsSection>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  pageTitle: {
    ...Typography.title,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  profileBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  profilePhone: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPlaceholder,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500',
  },
  rowLabelDestructive: {
    color: '#EF4444',
  },
  rowValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  rowChevron: {
    fontSize: 20,
    color: Colors.textPlaceholder,
    lineHeight: 22,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
});
