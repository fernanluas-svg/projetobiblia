import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HOME_THEMES, useApp } from '../context/AppContext';

const FONT_OPTIONS = [14, 16, 18, 20, 22];

export default function SettingsScreen() {
  const {
    theme,
    themeKey,
    updateTheme,
    fontSize,
    setFontSize,
  } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>Aparência</Text>

        <Text style={[styles.fontLabel, { color: theme.text }]}>Tamanho da fonte</Text>
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
      </View>

      <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>Tema do App</Text>
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
                  {value.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  group: {
    borderRadius: 14,
    padding: 16,
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
    marginTop: 16,
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
    marginTop: 4,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
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
});
