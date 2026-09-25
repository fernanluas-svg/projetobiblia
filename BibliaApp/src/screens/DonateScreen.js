import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useApp } from '../context/AppContext';

const PIX_KEY = 'goldevapp@gmail.com';

export default function DonateScreen() {
  const { theme, t } = useApp();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.intro, { color: theme.text, fontWeight: 'bold' }]}>
        {t('donate.intro')}
      </Text>

      <View style={[styles.qrCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Image
          source={require('../../assets/contribuicao.png')}
          style={styles.qrImage}
          resizeMode="contain"
          accessibilityLabel={t('donate.qrLabel')}
        />
      </View>

      <View style={[styles.emailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.emailTextContainer}>
          <Text style={[styles.emailLabel, { color: theme.textMuted }]}>{t('donate.emailKey')}</Text>
          <Text style={[styles.emailValue, { color: theme.text }]}>{PIX_KEY}</Text>
        </View>
        <TouchableOpacity
          style={[styles.copyEmailButton, { backgroundColor: theme.selection }]}
          onPress={handleCopy}
          hitSlop={8}
        >
          <Ionicons
            name={copied ? 'checkmark' : 'copy-outline'}
            size={18}
            color={theme.primary}
          />
        </TouchableOpacity>
      </View>

      <Text style={[styles.thanks, { color: theme.text, fontWeight: 'bold' }]}>
        {t('donate.thanks')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    alignItems: 'center',
  },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 20,
  },
  qrCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  qrImage: {
    width: 220,
    height: 220,
    borderRadius: 8,
  },
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  emailTextContainer: {
    flex: 1,
  },
  emailLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  emailValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  copyEmailButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  thanks: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
});