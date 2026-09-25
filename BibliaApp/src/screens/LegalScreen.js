import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';

const PRIVACY_POLICY_URL = 'https://sites.google.com/view/polticadeprivbibliasagrada/in%C3%ADcio';

const SECTIONS = [
  {
    key: 'disclaimer',
    icon: 'shield-checkmark-outline',
    titleKey: 'legal.disclaimerTitle',
    items: [
      { itemTitleKey: 'legal.disclaimerNatureTitle', itemBodyKey: 'legal.disclaimerNatureBody' },
      { itemTitleKey: 'legal.disclaimerContentTitle', itemBodyKey: 'legal.disclaimerContentBody' },
      { itemTitleKey: 'legal.disclaimerStorageTitle', itemBodyKey: 'legal.disclaimerStorageBody' },
      { itemTitleKey: 'legal.disclaimerLinksTitle', itemBodyKey: 'legal.disclaimerLinksBody' },
    ],
  },
  {
    key: 'affiliate',
    icon: 'link-outline',
    titleKey: 'legal.affiliateTitle',
    items: [
      { itemTitleKey: 'legal.affiliateSupportTitle', itemBodyKey: 'legal.affiliateSupportBody' },
      { itemTitleKey: 'legal.affiliateHowTitle', itemBodyKey: 'legal.affiliateHowBody' },
      { itemTitleKey: 'legal.affiliateNoCostTitle', itemBodyKey: 'legal.affiliateNoCostBody' },
      { itemTitleKey: 'legal.affiliateCommitTitle', itemBodyKey: 'legal.affiliateCommitBody' },
    ],
  },
];

export default function LegalScreen({ navigation }) {
  const { theme, t } = useApp();

  const openPrivacyPolicy = () => {
    Linking.openURL(PRIVACY_POLICY_URL).catch(() => {});
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.headerContainer,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={[styles.menuCircle, { backgroundColor: theme.background }]}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
          {t('nav.legal')}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={openPrivacyPolicy}
          accessibilityRole="link"
          accessibilityLabel={t('legal.privacyOpen')}
        >
          <View style={[styles.group, styles.groupSpacing, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionTextWrap}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{t('legal.privacyTitle')}</Text>
                <Text style={[styles.sectionBody, { color: theme.textMuted }]}>
                  {t('legal.privacyPlaceholder')}
                </Text>
                <View style={styles.linkHintRow}>
                  <Ionicons name="open-outline" size={13} color={theme.primary} />
                  <Text style={[styles.linkHintText, { color: theme.primary }]}>{t('legal.privacyHint')}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color={theme.textMuted} style={styles.rowChevron} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{t('legal.termsTitle')}</Text>
          {SECTIONS.map((section, sectionIndex) => (
            <View key={section.key}>
              {sectionIndex > 0 ? <View style={[styles.divider, { backgroundColor: theme.border }]} /> : null}
              <View style={styles.sectionRow}>
                <View style={styles.sectionTextWrap}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>{t(section.titleKey)}</Text>
                </View>
              </View>
              {section.items.map((item) => (
                <View key={item.itemTitleKey} style={styles.itemBlock}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{t(item.itemTitleKey)}</Text>
                  <Text style={[styles.itemBody, { color: theme.textMuted }]}>{t(item.itemBodyKey)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlaceholder: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  group: {
    borderRadius: 14,
    padding: 16,
  },
  groupSpacing: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  itemBlock: {
    marginTop: 14,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  itemBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  linkHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  linkHintText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowChevron: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});