import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useApp } from '../context/AppContext';
import { quizData } from '../data/quizQuestions';
import { submitScore, fetchRanking } from '../utils/ranking';

const PLAYER_NAME_KEY = '@bibliaapp/playerName';
const POINTS_PER_HIT = 10;

const ALTERNATIVA_LETRAS = ['a', 'b', 'c', 'd'];
const ALTERNATIVA_LABEL = ['A', 'B', 'C', 'D'];

const COUNT_OPTIONS = [15, 25, 30, 40];

const MODES = [
  {
    key: 'tranquilo',
    label: 'Tranquilo',
    icon: 'leaf',
    dificuldades: ['facil', 'medio'],
    descricao: 'Mistura de perguntas fáceis e médias para aquecer.',
    cor: '#169B4E',
    corTint: 'rgba(22, 163, 74, 0.13)',
  },
  {
    key: 'intermediario',
    label: 'Intermediário',
    icon: 'analytics',
    dificuldades: ['medio'],
    descricao: 'Somente perguntas de nível médio.',
    cor: '#D97706',
    corTint: 'rgba(217, 119, 6, 0.15)',
  },
  {
    key: 'hard',
    label: 'Hard',
    icon: 'flame',
    dificuldades: ['dificil'],
    descricao: 'Somente as perguntas mais difíceis da Bíblia.',
    cor: '#DC2626',
    corTint: 'rgba(220, 38, 38, 0.13)',
  },
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toQuestion(raw) {
  return {
    id: raw.id,
    pergunta: raw.pergunta,
    opcoes: ALTERNATIVA_LETRAS.map((letra) => raw.alternativas[letra]),
    correta: raw.resposta_correta,
    referencia: raw.referencia,
    explicacao: raw.explicacao,
  };
}

const perguntasArray = quizData.quiz.perguntas;

function availableCountFor(modeKey) {
  const mode = MODES.find((m) => m.key === modeKey);
  return perguntasArray.filter((q) => mode.dificuldades.includes(q.dificuldade)).length;
}

function prepareQuestions(modeKey, count) {
  const mode = MODES.find((m) => m.key === modeKey);
  const pool = perguntasArray.filter((q) => mode.dificuldades.includes(q.dificuldade));
  const take = Math.min(count, pool.length);
  return shuffleArray(pool).slice(0, take).map(toQuestion);
}

function resultMessage(score, total) {
  const pct = total > 0 ? score / (total * POINTS_PER_HIT) : 0;
  if (pct >= 0.9) return 'Incrível! Você é um verdadeiro craque do conhecimento bíblico!';
  if (pct >= 0.71) {
    return pct >= 0.85
      ? 'Parabéns! Desempenho fora de série — você está voando alto na Palavra!'
      : 'Parabéns! Seu conhecimento está acima da média, continue assim!';
  }
  if (pct >= 0.6) return 'Muito bem! Você está afiado na Palavra, continue firme!';
  if (pct > 0.5) return 'Quase lá! Pouco mais de leitura e você chega ao topo.';
  return 'Não desanime! Leia um pouco mais a Bíblia e tente de novo — a prática leva à perfeição.';
}

export default function QuizScreen() {
  const { theme } = useApp();
  const [phase, setPhase] = useState('home');
  const [modeKey, setModeKey] = useState('tranquilo');
  const [questionCount, setQuestionCount] = useState(15);
  const [soundOn, setSoundOn] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [playerName, setPlayerName] = useState('');
  const [rankStatus, setRankStatus] = useState('idle');
  const [ranking, setRanking] = useState([]);
  const [rankSaving, setRankSaving] = useState(false);
  const [rankError, setRankError] = useState(null);

  const correctPlayer = useAudioPlayer(require('../../assets/sounds/correct.wav'));
  const wrongPlayer = useAudioPlayer(require('../../assets/sounds/wrong.wav'));

  const total = questions.length;
  const maxScore = total * POINTS_PER_HIT;
  const mode = MODES.find((m) => m.key === modeKey);
  const availCount = availableCountFor(modeKey);
  const isDark = theme.dark;

  const replaySound = (player) => {
    if (!soundOn) return;
    try {
      player.pause();
      player.seekTo(0).then(() => player.play()).catch(() => {});
    } catch (e) {
      // som indisponível neste ambiente
    }
  };

  const loadRanking = async () => {
    setRankStatus('loading');
    const res = await fetchRanking(10);
    if (!res.ok) {
      setRanking([]);
      setRankStatus('offline');
      return;
    }
    setRanking(res.entries);
    setRankStatus(res.entries.length ? 'ok' : 'empty');
  };

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PLAYER_NAME_KEY);
        if (saved) setPlayerName(saved);
      } catch (e) {
        // falha ao ler nome salvo
      }
      await loadRanking();
    })();
  }, []);

  const startQuiz = () => {
    setQuestions(prepareQuestions(modeKey, questionCount));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setRankError(null);
    setPhase('playing');
  };

  const selectCount = (value) => {
    setQuestionCount(value);
  };

  const selectOption = (letra) => {
    if (selected !== null) return;
    setSelected(letra);
    if (letra === questions[current].correta) {
      setScore((s) => s + POINTS_PER_HIT);
      replaySound(correctPlayer);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      replaySound(wrongPlayer);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const goNext = () => {
    if (current + 1 >= total) {
      setPhase('result');
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const goBackToSetup = () => {
    setPhase('home');
  };

  const confirmQuit = () => {
    Alert.alert('Sair do quiz?', 'Sua partida atual será perdida.', [
      { text: 'Continuar jogando', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: goBackToSetup },
    ]);
  };

  const saveRanking = async () => {
    const name = playerName.trim();
    if (!name || rankSaving) return;
    setRankSaving(true);
    setRankError(null);
    try {
      await AsyncStorage.setItem(PLAYER_NAME_KEY, name);
    } catch (e) {
      // falha ao salvar nome
    }
    const res = await submitScore(name, score);
    setRankSaving(false);
    if (!res.ok) {
      setRankError('Não foi possível enviar sua pontuação agora. O quiz continua disponível offline.');
      return;
    }
    await loadRanking();
  };

  const renderRanking = () => {
    if (rankStatus === 'loading') {
      return (
        <View style={styles.rankBox}>
          <ActivityIndicator color={theme.primary} />
          <Text style={[styles.rankHint, { color: theme.textMuted }]}>Carregando ranking...</Text>
        </View>
      );
    }
    if (rankStatus === 'offline') {
      return (
        <View style={[styles.rankBox, styles.rankBoxOffline]}>
          <Ionicons name="cloud-offline-outline" size={28} color={theme.textMuted} />
          <Text style={[styles.rankTitle, { color: theme.text }]}>Ranking indisponível</Text>
          <Text style={[styles.rankHint, { color: theme.textMuted }]}>
            Sem conexão com o ranking agora. O quiz continua funcionando normalmente.
          </Text>
        </View>
      );
    }
    if (rankStatus === 'empty') {
      return (
        <View style={styles.rankBox}>
          <Ionicons name="trophy-outline" size={28} color={theme.primary} />
          <Text style={[styles.rankTitle, { color: theme.text }]}>Nenhuma pontuação ainda</Text>
          <Text style={[styles.rankHint, { color: theme.textMuted }]}>
            Seja o primeiro a entrar no ranking!
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.rankBox}>
        <Text style={[styles.rankTitle, { color: theme.text }]}>Ranking</Text>
        {ranking.map((entry) => (
          <View key={`${entry.rank}-${entry.name}`} style={styles.rankRow}>
            <Text style={[styles.rankPos, { color: theme.textMuted }]}>#{entry.rank}</Text>
            <Text style={[styles.rankName, { color: theme.text }]} numberOfLines={1}>
              {entry.name}
            </Text>
            <Text style={[styles.rankScore, { color: theme.primary }]}>{entry.score} pts</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderSetup = () => (
    <View>
      <View style={[styles.hero, { backgroundColor: theme.primary }]}>
        <Ionicons name="help-circle" size={44} color="#FFFFFF" />
        <Text style={styles.heroTitle}>Mini Quiz da Bíblia</Text>
        <Text style={styles.heroSubtitle}>
          Escolha um modo, defina a quantidade e teste seus conhecimentos com {perguntasArray.length} perguntas.
        </Text>
      </View>

      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Seu nome no ranking</Text>
      <TextInput
        style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
        placeholder="Digite seu nome"
        placeholderTextColor={theme.textMuted}
        value={playerName}
        onChangeText={setPlayerName}
        maxLength={20}
      />

      <Text style={[styles.sectionLabel, { color: theme.text }]}>Modo de jogo</Text>
      <View style={styles.modesList}>
        {MODES.map((m) => {
          const active = modeKey === m.key;
          const avail = availableCountFor(m.key);
          return (
            <TouchableOpacity
              key={m.key}
              style={[
                styles.modeCard,
                {
                  backgroundColor: active ? m.corTint : theme.surface,
                  borderColor: active ? m.cor : theme.border,
                },
              ]}
              onPress={() => setModeKey(m.key)}
              activeOpacity={0.8}
            >
              <View style={[styles.modeIcon, { backgroundColor: m.cor }]}>
                <Ionicons name={m.icon} size={20} color="#FFFFFF" />
              </View>
              <View style={styles.modeInfo}>
                <View style={styles.modeTitleRow}>
                  <Text style={[styles.modeTitle, { color: theme.text }]}>{m.label}</Text>
                  {active && <Ionicons name="checkmark-circle" size={18} color={m.cor} />}
                </View>
                <Text style={[styles.modeDesc, { color: theme.textMuted }]}>{m.descricao}</Text>
                <Text style={[styles.modeAvail, { color: m.cor }]}>
                  {avail} {avail === 1 ? 'pergunta disponível' : 'perguntas disponíveis'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: theme.text }]}>Quantas perguntas?</Text>
      <View style={styles.countRow}>
        {COUNT_OPTIONS.map((value) => {
          const disabled = value > availCount;
          const active = questionCount === value;
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.countChip,
                {
                  backgroundColor: active ? theme.primary : theme.surface,
                  borderColor: active ? theme.primary : theme.border,
                },
                disabled && styles.countChipDisabled,
              ]}
              onPress={() => selectCount(value)}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.countChipText,
                  { color: active ? '#FFFFFF' : theme.text },
                  disabled && { color: theme.textMuted },
                ]}
              >
                {value}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {questionCount > availCount && (
        <Text style={[styles.availHint, { color: theme.textMuted }]}>
          Neste modo só há {availCount} {availCount === 1 ? 'pergunta' : 'perguntas'} — a partida usará {availCount}.
        </Text>
      )}

      <View style={styles.soundRow}>
        <TouchableOpacity style={styles.soundToggle} onPress={() => setSoundOn((v) => !v)} activeOpacity={0.8}>
          <Ionicons
            name={soundOn ? 'volume-high' : 'volume-mute'}
            size={20}
            color={soundOn ? theme.primary : theme.textMuted}
          />
          <Text style={[styles.soundLabel, { color: theme.text }]}>Efeitos sonoros</Text>
          <Text
            style={[
              styles.soundState,
              { color: soundOn ? theme.primary : theme.textMuted },
            ]}
          >
            {soundOn ? 'Ativados' : 'Desativados'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={startQuiz}>
        <Ionicons name="play" size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Iniciar Quiz</Text>
      </TouchableOpacity>

      <View style={styles.sectionTitleRow}>
        <Ionicons name="trophy" size={18} color={isDark ? '#FFC107' : '#B45309'} />
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Ranking</Text>
      </View>
      {renderRanking()}
    </View>
  );

  const renderPlaying = () => (
    <View style={styles.quizCard}>
      <View style={styles.quitRow}>
        <TouchableOpacity style={[styles.quitButton, { borderColor: theme.border }]} onPress={confirmQuit} activeOpacity={0.7}>
          <Ionicons name="exit-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.quitText, { color: theme.textMuted }]}>Sair do quiz</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressHeader}>
        <View style={styles.progressModeRow}>
        <Text style={[styles.progressMode, { color: mode.cor }]}>{mode.label}</Text>
        <Text style={[styles.progressText, { color: theme.textMuted }]}>
          • Pergunta {current + 1} de {total}
        </Text>
      </View>
        <Text style={[styles.progressScore, { color: theme.primary }]}>{score} pts</Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: theme.primary, width: `${((current + (selected !== null ? 1 : 0)) / total) * 100}%` },
          ]}
        />
      </View>

      <Text style={[styles.question, { color: theme.text }]}>{questions[current].pergunta}</Text>

      <View style={styles.optionsList}>
        {questions[current].opcoes.map((texto, index) => {
          const letra = ALTERNATIVA_LETRAS[index];
          let optionStyle = {
            backgroundColor: theme.surface,
            borderColor: theme.border,
          };
          let textColor = theme.text;
          let badgeColor = theme.textMuted;
          let badgeBg = 'transparent';
          if (selected !== null) {
            if (letra === questions[current].correta) {
              optionStyle = { backgroundColor: '#16A34A', borderColor: '#16A34A' };
              textColor = '#FFFFFF';
              badgeColor = '#FFFFFF';
              badgeBg = 'rgba(255,255,255,0.2)';
            } else if (letra === selected) {
              optionStyle = { backgroundColor: '#DC2626', borderColor: '#DC2626' };
              textColor = '#FFFFFF';
              badgeColor = '#FFFFFF';
              badgeBg = 'rgba(255,255,255,0.2)';
            } else {
              optionStyle = { backgroundColor: theme.surface, borderColor: theme.border, opacity: 0.6 };
            }
          }
          return (
            <TouchableOpacity
              key={letra}
              style={[styles.option, optionStyle]}
              onPress={() => selectOption(letra)}
              activeOpacity={0.8}
              disabled={selected !== null}
            >
              <View style={[styles.optionBadge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.optionBadgeText, { color: badgeColor }]}>{ALTERNATIVA_LABEL[index]}</Text>
              </View>
              <Text style={[styles.optionText, { color: textColor }]}>{texto}</Text>
              {selected !== null && letra === questions[current].correta && (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
              {selected !== null && letra === selected && letra !== questions[current].correta && (
                <Ionicons name="close-circle" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selected !== null && (
        <View style={[styles.explainBox, { backgroundColor: isDark ? '#1F2937' : '#F0FDF4', borderColor: '#86EFAC' }]}>
          <View style={styles.explainHeader}>
            <Ionicons
              name={selected === questions[current].correta ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={selected === questions[current].correta ? '#16A34A' : '#DC2626'}
            />
            <Text
              style={[
                styles.explainTitle,
                { color: selected === questions[current].correta ? '#16A34A' : '#DC2626' },
              ]}
            >
              {selected === questions[current].correta ? 'Resposta certa!' : 'Resposta incorreta'}
            </Text>
          </View>
          <Text style={[styles.explainRef, { color: theme.textMuted }]}>{questions[current].referencia}</Text>
          <Text style={[styles.explainText, { color: theme.text }]}>{questions[current].explicacao}</Text>
        </View>
      )}

      {selected !== null && (
        <TouchableOpacity style={[styles.nextButton, { backgroundColor: theme.primary }]} onPress={goNext}>
          <Text style={styles.primaryButtonText}>{current + 1 >= total ? 'Ver resultado' : 'Próxima pergunta'}</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderResult = () => {
    const pct = total > 0 ? Math.round((score / maxScore) * 100) : 0;
    const icon = pct >= 90 ? 'ribbon' : pct >= 60 ? 'trophy' : 'flag';
    return (
      <View>
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <Ionicons name={icon} size={44} color="#FFFFFF" />
          <Text style={styles.heroTitle}>Você acertou {pct}%</Text>
          <Text style={styles.heroSubtitle}>
            {score} de {maxScore} pontos máximos.
          </Text>
          <Text style={styles.heroMessage}>{resultMessage(score, maxScore)}</Text>
        </View>

        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>Salvar pontuação no ranking</Text>
        <TextInput
          style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
          placeholder="Seu nome no ranking"
          placeholderTextColor={theme.textMuted}
          value={playerName}
          onChangeText={setPlayerName}
          maxLength={20}
        />

        {rankError && (
          <View style={[styles.errorBox, { backgroundColor: isDark ? '#3B1F24' : '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={[styles.errorText, { color: '#DC2626' }]}>{rankError}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primary }]}
          onPress={saveRanking}
          disabled={!playerName.trim() || rankSaving}
        >
          {rankSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="trophy-outline" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Salvar no ranking</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={startQuiz}>
          <Ionicons name="refresh" size={18} color={theme.primary} />
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Jogar novamente</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.secondaryButton, { borderColor: theme.border }]} onPress={goBackToSetup}>
          <Ionicons name="options-outline" size={18} color={theme.primary} />
          <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Trocar modo e quantidade</Text>
        </TouchableOpacity>

        <View style={styles.sectionTitleRow}>
          <Ionicons name="trophy" size={18} color={isDark ? '#FFC107' : '#B45309'} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ranking</Text>
        </View>
        {renderRanking()}
      </View>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {phase === 'home' && renderSetup()}
      {phase === 'playing' && total > 0 && renderPlaying()}
      {phase === 'result' && renderResult()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  hero: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10,
    textAlign: 'center',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  heroMessage: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
  },
  modesList: {
    gap: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
    gap: 12,
  },
  modeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeInfo: {
    flex: 1,
  },
  modeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modeDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  modeAvail: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  countRow: {
    flexDirection: 'row',
    gap: 10,
  },
  countChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    height: 48,
  },
  countChipDisabled: {
    opacity: 0.45,
  },
  countChipText: {
    fontSize: 16,
    fontWeight: '700',
  },
  availHint: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 17,
  },
  soundRow: {
    marginTop: 18,
    marginBottom: 4,
  },
  soundToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  soundLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  soundState: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    height: 48,
    marginTop: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    marginTop: 10,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  rankBox: {
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(127,127,127,0.2)',
  },
  rankBoxOffline: {
    paddingVertical: 24,
  },
  rankTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  rankHint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(127,127,127,0.25)',
    alignSelf: 'stretch',
  },
  rankPos: {
    width: 36,
    fontSize: 14,
    fontWeight: '700',
  },
  rankName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  rankScore: {
    fontSize: 14,
    fontWeight: '700',
  },
  quizCard: {
    borderRadius: 16,
    padding: 16,
  },
  quitRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  quitText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressMode: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressScore: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  question: {
    fontSize: 19,
    fontWeight: 'bold',
    lineHeight: 27,
    marginBottom: 18,
  },
  optionsList: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  optionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    marginRight: 8,
  },
  explainBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  explainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  explainTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  explainRef: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  explainText: {
    fontSize: 14,
    lineHeight: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    height: 48,
    marginTop: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});