import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Dicionário mínimo local: este componente vive fora do AppProvider,
// então lê o idioma persistido diretamente para não exibir PT fixo.
const STRINGS = {
  'pt-BR': {
    title: 'Ops, algo deu errado',
    message:
      'Encontramos um erro inesperado ao carregar o aplicativo. Pedimos desculpas pelo transtorno.',
    retry: 'Tentar novamente',
  },
  en: {
    title: 'Oops, something went wrong',
    message:
      'We found an unexpected error while loading the app. Sorry for the trouble.',
    retry: 'Try again',
  },
  es: {
    title: 'Ups, algo salió mal',
    message:
      'Encontramos un error inesperado al cargar la aplicación. Pedimos disculpas por las molestias.',
    retry: 'Intentar de nuevo',
  },
};

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, language: 'pt-BR' };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    AsyncStorage.getItem('@bibliaapp/language').then((raw) => {
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed && STRINGS[parsed]) this.setState({ language: parsed });
      } catch (e) {
        // mantém pt-BR
      }
    }).catch(() => {});
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const s = STRINGS[this.state.language] ?? STRINGS['pt-BR'];
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#C94A6E" />
            </View>
            <Text style={styles.title}>{s.title}</Text>
            <Text style={styles.message}>
              {s.message}
            </Text>
            {this.state.error?.message ? (
              <Text style={styles.errorDetail} selectable>
                {String(this.state.error.message)}
              </Text>
            ) : null}
            <TouchableOpacity style={styles.button} onPress={this.handleReset} activeOpacity={0.8}>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>{s.retry}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4EE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#E4DACC',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222222',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B6560',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  errorDetail: {
    fontSize: 12,
    color: '#8A2B3F',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', web: 'monospace' }),
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#2f6f4f',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#2f6f4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
