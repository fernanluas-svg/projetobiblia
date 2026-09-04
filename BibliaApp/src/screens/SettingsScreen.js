import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { HOME_THEMES, useApp } from '../context/AppContext';

const FONT_OPTIONS = [14, 16, 18, 20, 22];

export default function SettingsScreen() {
  const {
    theme,
    darkMode,
    setDarkMode,
    fontSize,
    setFontSize,
    homeTheme,
    updateHomeTheme,
  } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.group, { backgroundColor: theme.surface }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>Aparência</Text>

        <View style={[styles.row, { borderBottomColor: theme.border }]}>
          <Text style={[styles.rowLabel, { color: theme.text }]}>Tema Escuro</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ true: theme.primary, false: theme.border }}
          />
        </View>

        <Text style={[styles.fontLabel, { color: theme.text }]}>Tamanho da fonte</Text>
        <View style={styles.fontRow}>
          {FONT_OPTIONS.map((size) => {
            const active = size === fontSize;
            return (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontOption,
                  active && { backgroundColor: theme.primary },
                ]}
                onPress={() => setFontSize(size)}
              >
                <Text
                  style={[
                    styles.fontOptionText,
                    { color: active ? '#fff' : theme.text },
                  ]}
                >
                  Aa
                </Text>
                <Text
                  style={[
                    styles.fontSizeText,
                    { color: active ? '#fff' : theme.textMuted },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.group, { backgroundColor: theme.surface }]}>
        <Text style={[styles.groupTitle, { color: theme.textMuted }]}>Tema da Home</Text>
        <View style={styles.themeRow}>
          {Object.entries(HOME_THEMES).map(([key, value]) => {
            const active = key === homeTheme;
            return (
              <TouchableOpacity
                key={key}
                style={styles.themeOption}
                onPress={() => updateHomeTheme(key)}
              >
                <View
                  style={[
                    styles.themeSwatch,
                    { backgroundColor: value.bg },
                    active && styles.themeSwatchActive,
                  ]}
                >
                  {active ? <View style={styles.themeCheck} /> : null}
                </View>
                <Text
                  style={[styles.themeLabel, { color: active ? theme.primary : theme.text }]}
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
    borderRadius: 12,
    padding: 16,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontSize: 16,
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
    borderColor: '#2f6f4f',
    borderWidth: 3,
  },
  themeCheck: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#2f6f4f',
  },
  themeLabel: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '500',
    textAlign: 'center',
  },
});
