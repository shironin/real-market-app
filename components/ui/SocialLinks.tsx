import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';

interface SocialLink {
  label: string;
  url: string;
  icon: 'logo-facebook' | 'logo-tiktok';
}

const FACEBOOK_LINKS: SocialLink[] = [
  {
    label: 'Viking',
    url: 'https://www.facebook.com/groups/305536016639924',
    icon: 'logo-facebook',
  },
  {
    label: 'RealMarket',
    url: 'https://www.facebook.com/profile.php?id=100093050927173',
    icon: 'logo-facebook',
  },
  {
    label: 'Melissa',
    url: 'https://www.facebook.com/melissa.singerei',
    icon: 'logo-facebook',
  },
];

const TIKTOK_LINKS: SocialLink[] = [
  {
    label: 'Viking',
    url: 'https://www.tiktok.com/@magazinviking',
    icon: 'logo-tiktok',
  },
  {
    label: 'RealMarket',
    url: 'https://www.tiktok.com/@realmarket.md',
    icon: 'logo-tiktok',
  },
  {
    label: 'Melissa',
    url: 'https://www.tiktok.com/@melissasingerei0',
    icon: 'logo-tiktok',
  },
];

function SocialLinkItem({ link }: { link: SocialLink }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.item}
      onPress={() => { void Linking.openURL(link.url); }}
    >
      <Ionicons name={link.icon} size={22} color={Colors.primary} />
      <Text style={styles.label} numberOfLines={1}>{link.label}</Text>
    </TouchableOpacity>
  );
}

export function SocialLinks() {
  return (
    <View style={styles.container}>
      <View style={styles.column}>
        {FACEBOOK_LINKS.map((link) => (
          <SocialLinkItem key={link.url} link={link} />
        ))}
      </View>
      <View style={styles.column}>
        {TIKTOK_LINKS.map((link) => (
          <SocialLinkItem key={link.url} link={link} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
  },
});
