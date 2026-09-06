import { useState } from 'react';
import { Alert, Platform, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Ionicons from '@expo/vector-icons/Ionicons';

import { HOME_THEMES, useApp } from '../context/AppContext';

const FONT_OPTIONS = [14, 16, 18, 20, 22];

const ALIGN_OPTIONS = (t) => [
  { value: 'left', label: t('settingsAlignLeft') },
  { value: 'right', label: t('settingsAlignRight') },
  { value: 'center', label: t('settingsAlignCenter') },
  { value: 'justify', label: t('settingsAlignJustify') },
];

const LANGUAGES = ['pt-BR', 'en', 'es'];

function formatTime(time) {
  const [h, m] = String(time || '07:00').split(':').map(Number);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function SwitchRow({ label, description, value, onValueChange, theme, disabled }) {
  return (
    <TouchableOpacity
      style={[styles.switchRow, { opacity: disabled ? 0.45 : 1 }]}
      activeOpacity={0.7}
      onPress={() => {
        if (!disabled) onValueChange(!value);
      }}
    >
      <View style={styles.switchTextWrap}>
        <Text style={[styles.switchLabel, { color: theme.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.switchDesc, { color: theme.textMuted }]}>{description}</Text>
        ) : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{ false: theme.bar, true: theme.primary }}
        thumbColor="#FFFFFF"
      />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const {
    theme,
    themeKey,
    updateTheme,
    fontSize,
    setFontSize,
    textAlign,
    setTextAlign,
    language,
    setLanguage,
    t,
    notificationsEnabled,
    setNotificationsEnabled,
    dailyVerseEnabled,
    setDailyVerseEnabled,
    dailyVerseTime,
    setDailyVerseTime,
  } = useApp();

  const [showTimePicker, setShowTimePicker] = useState(false);

  const alignOptions = ALIGN_OPTIONS(t);

  const toggleNotifications = async (value) => {
    const ok = await setNotificationsEnabled(value);
    if (!ok) {
      Alert.alert(t('settingsPermissionDenied'));
    }
  };

  const initialTime = new Date();
  const [h, m] = String(dailyVerseTime || '07:00').split(':').map(Number);
  initialTime.setHours(Number.isFinite(h) ? h : 7, Number.isFinite(m) ? m : 0, 0, 0);

  const onTimeChange = (event, date) => {
    setShowTimePicker(false);
    if (event.type === 'set' && date) {
      setDailyVerseTime(
        `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.group, styles.groupSpacing, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{t('settingsAppearance')}</Text>

        <Text style={[styles.fontLabel, { color: theme.text }]}>{t('settingsFontSize')}</Text>
        <View style={styles.fontRow}>
          {FONT_OPTIONS.map((size) => {
            const active = size === fontSize;
            return (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontOption,
                  { borderColor: active ? theme.primary : theme.border, borderWidth: active ? 2 : 1 },
                  active && { backgroundColor: theme.selection },
                ]}
                onPress={() => setFontSize(size)}
              >
                <Text
                  style={[
                    styles.fontOptionText,
                    { color: active ? theme.primary : theme.text, fontWeight: active ? 'bold' : '600' },
                  ]}
                >
                  Aa
                </Text>
                <Text
                  style={[
                    styles.fontSizeText,
                    { color: active ? theme.primary : theme.textMuted, fontWeight: active ? '700' : 'normal' },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.groupTitle, { color: theme.textMuted, marginTop: 20 }]}>{t('settingsTheme')}</Text>
        <View style={styles.themeRow}>
          {Object.entries(HOME_THEMES).map(([key, value]) => {
            const active = key === themeKey;
            return (
              <TouchableOpacity
                key={key}
                style={styles.themeOption}
                onPress={() => updateTheme(key)}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: value.colors.background, borderColor: active ? value.colors.primary : theme.border },
                    active && styles.themeSwatchActive,
                  ]}
                >
                  {active ? <View style={[styles.themeCheck, { backgroundColor: value.colors.primary }]} /> : null}
                </View>
                <Text
                  style={[styles.themeLabel, { color: active ? value.colors.primary : theme.text, fontWeight: active ? 'bold' : '500' }]}
                >
                  {t(`theme.${key}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.group, styles.groupSpacing, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{t('settingsNotifications')}</Text>

        <SwitchRow
          label={t('settingsNotifications')}
          description={t('settingsNotificationsDesc')}
          value={notificationsEnabled}
          onValueChange={toggleNotifications}
          theme={theme}
          disabled={false}
        />

        {notificationsEnabled && (
          <>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <SwitchRow
              label={t('settingsVerseOfTheDay')}
              description={t('settingsVerseOfTheDayDesc')}
              value={dailyVerseEnabled}
              onValueChange={setDailyVerseEnabled}
              theme={theme}
              disabled={false}
            />

            {dailyVerseEnabled && (
              <View style={styles.timeRow}>
                <View style={styles.switchTextWrap}>
                  <Text style={[styles.switchLabel, { color: theme.text }]}>{t('settingsScheduleTime')}</Text>
                  <Text style={[styles.timeValue, { color: theme.primary }]}>
                    {formatTime(dailyVerseTime)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.timeButton, { backgroundColor: theme.selection }]}
                  activeOpacity={0.7}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                  <Text style={[styles.timeButtonText, { color: theme.primary }]}>{t('settingsSetTime')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {showTimePicker && Platform.OS !== 'web' ? (
          <DateTimePicker
            value={initialTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onTimeChange}
          />
        ) : null}
      </View>

      <View style={[styles.group, styles.groupSpacing, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{t('settingsTextAlign')}</Text>
        <View style={styles.alignRow}>
          {alignOptions.map((option) => {
            const active = option.value === textAlign;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.alignOption,
                  { borderColor: active ? theme.primary : theme.border, borderWidth: active ? 2 : 1 },
                  active && { backgroundColor: theme.selection },
                ]}
                onPress={() => setTextAlign(option.value)}
              >
                <Text
                  style={[
                    styles.alignOptionText,
                    { color: active ? theme.primary : theme.text, fontWeight: active ? 'bold' : '600' },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>{t('settingsLanguage')}</Text>
        {LANGUAGES.map((lang, index) => {
          const active = lang === language;
          return (
            <TouchableOpacity
              key={lang}
              style={[
                styles.languageRow,
                index < LANGUAGES.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
              ]}
              activeOpacity={0.7}
              onPress={() => setLanguage(lang)}
            >
              <Text style={[styles.languageLabel, { color: active ? theme.primary : theme.text, fontWeight: active ? 'bold' : '500' }]}>
                {t(`languages.${lang}`)}
              </Text>
              {active ? <Ionicons name="checkmark-circle" size={20} color={theme.primary} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  fontLabel: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 12,
  },
  fontRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fontOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  fontOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
  fontSizeText: {
    fontSize: 12,
    marginTop: 2,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  themeOption: {
    flexBasis: '25%',
    alignItems: 'center',
    marginVertical: 8,
  },
  themeSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeSwatchActive: {
    borderWidth: 3.5,
  },
  themeCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeLabel: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  switchTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  switchDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  timeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  alignRow: {
    flexDirection: 'row',
  },
  alignOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  alignOptionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  languageLabel: {
    fontSize: 16,
  },
});