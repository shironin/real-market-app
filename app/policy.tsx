import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../i18n/LanguageContext';
import { POLICY_RO, POLICY_RU } from '../i18n/policy-content';
import { Colors } from '../theme/colors';

export default function PolicyScreen() {
  const { t, language } = useLanguage();
  const content = language === 'ru' ? POLICY_RU : POLICY_RO;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>{language === 'ru' ? '← Назад' : '← Înapoi'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Markdown style={markdownStyles}>{content}</Markdown>
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
    paddingHorizontal: 28,
    paddingTop: 8,
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
  scroll: {
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
});

const markdownStyles = StyleSheet.create({
  body: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 4,
  },
  strong: {
    fontWeight: '700',
    color: Colors.text,
  },
  hr: {
    backgroundColor: Colors.border ?? '#E0E0E0',
    height: 1,
    marginVertical: 12,
  },
  bullet_list: {
    marginBottom: 8,
  },
  list_item: {
    marginBottom: 4,
  },
  paragraph: {
    marginBottom: 8,
  },
});
