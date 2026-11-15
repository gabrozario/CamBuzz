import { ChevronLeft } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, useAppTheme, type AppColors } from '../../theme';

interface Props {
  visible: boolean;
  /** Fechar (toque fora, botão voltar do Android). */
  onClose: () => void;
  /** Se presente, mostra "‹ Return" no topo (Figma). Padrão: igual a onClose. */
  onReturn?: () => void;
  showReturn?: boolean;
  title?: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Popup centralizado das telas de agenda (Figma "Add Course", "Add Event", "Invite friends", "Edit account"):
 * fundo escurecido, cartão com cantos bem arredondados, "‹ Return", título grande e subtítulo.
 * O conteúdo rola se não couber (ex.: com o teclado aberto).
 */
export function DialogCard({ visible, onClose, onReturn, showReturn = true, title, subtitle, children }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onReturn ?? onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {showReturn && (
                <Pressable
                  onPress={onReturn ?? onClose}
                  hitSlop={12}
                  style={({ pressed }) => [styles.returnRow, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel="Return"
                >
                  <ChevronLeft size={18} color={c.accentSoftText} strokeWidth={2.4} />
                  <Text style={styles.returnText}>Return</Text>
                </Pressable>
              )}
              {title && <Text style={styles.title}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
              {children}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    flex: { flex: 1 },
    backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.overlay },
    center: { flex: 1, justifyContent: 'center', paddingHorizontal: 18, paddingVertical: 40 },
    card: {
      maxHeight: '100%',
      backgroundColor: c.card,
      borderRadius: 32,
      overflow: 'hidden',
    },
    content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28 },
    returnRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginLeft: -4, marginBottom: 24 },
    returnText: { fontFamily: fonts.semibold, fontSize: 15, color: c.accentSoftText },
    pressed: { opacity: 0.6 },
    title: { fontFamily: fonts.bold, fontSize: 28, color: c.text, letterSpacing: -0.4 },
    subtitle: { fontFamily: fonts.regular, fontSize: 14, color: c.muted, marginTop: 8, marginBottom: 8 },
  });
