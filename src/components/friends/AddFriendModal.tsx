import * as Clipboard from 'expo-clipboard';
import { ArrowRight, Check, Share2, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFriends } from '../../services/friends/FriendsProvider';
import { displayLink } from '../../services/friends/invite';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

type Feedback = { kind: 'success' | 'error'; text: string } | null;

/**
 * Popup "Add Friends" (figma-designs/Add Friends · Popup.png):
 * 1) copiar seu link de convite; 2) colar o email de um amigo.
 */
export function AddFriendModal({ visible, onClose }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { inviteLink, addFriendByEmail } = useFriends();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  // Limpa o formulário toda vez que o popup abre.
  useEffect(() => {
    if (visible) {
      setEmail('');
      setFeedback(null);
      setCopied(false);
    }
  }, [visible]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    Share.share({ message: `Add me on Cambuzz so we can see each other's day on campus: ${inviteLink}` });
  };

  const submit = async () => {
    if (!email.trim() || sending) return;
    setSending(true);
    setFeedback(null);
    const result = await addFriendByEmail(email);
    setSending(false);
    if (!result.ok) {
      setFeedback({ kind: 'error', text: result.error });
    } else if (result.friend) {
      setFeedback({ kind: 'success', text: `${result.friend.name} is now your friend. See them in Friends.` });
      setEmail('');
    } else {
      setFeedback({ kind: 'success', text: `Request sent to ${result.request.email}.` });
      setEmail('');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Fundo escurecido: tocar fora fecha */}
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

        <View style={styles.center} pointerEvents="box-none">
          <View style={styles.card} accessibilityViewIsModal>
            <View style={styles.header}>
              <Text style={styles.title}>Add Friends</Text>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
                <X size={24} color={colors.muted} strokeWidth={1.8} />
              </Pressable>
            </View>

            {/* 1. Link de convite */}
            <Text style={styles.sectionTitle}>Copy your link</Text>
            <Text style={styles.sectionSub}>Share your profile with friends.</Text>
            <View style={styles.linkBox}>
              <Pressable
                onPress={copyLink}
                style={styles.linkPress}
                accessibilityRole="button"
                accessibilityLabel="Copy your invite link"
              >
                {copied ? (
                  <View style={styles.copiedRow}>
                    <Check size={18} color={colors.green} strokeWidth={2.2} />
                    <Text style={styles.copiedText}>Link copied</Text>
                  </View>
                ) : (
                  <Text style={styles.linkText} numberOfLines={1}>
                    {displayLink(inviteLink)}
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={shareLink} hitSlop={10} accessibilityRole="button" accessibilityLabel="Share link">
                <Share2 size={18} color={colors.green} strokeWidth={1.8} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* 2. Email do amigo */}
            <Text style={styles.sectionTitle}>Paste friend's email</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  setFeedback(null);
                }}
                placeholder="friend@gatech.edu"
                placeholderTextColor={colors.subtle}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={submit}
                editable={!sending}
                accessibilityLabel="Friend's email"
              />
              {sending ? (
                <ActivityIndicator color={colors.green} style={styles.spinner} />
              ) : (
                email.trim().length > 0 && (
                  <Pressable
                    onPress={submit}
                    style={styles.sendBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Send friend request"
                  >
                    <ArrowRight size={20} color={colors.onInk} strokeWidth={2} />
                  </Pressable>
                )
              )}
            </View>
            {feedback && (
              <Text style={[styles.feedback, feedback.kind === 'error' ? styles.error : styles.success]}>
                {feedback.text}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(5, 30, 57, 0.35)' },
  center: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.divider,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 24,
    shadowColor: '#051E39',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontFamily: fonts.bold, fontSize: 22, color: colors.ink },
  sectionTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  sectionSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 6 },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    backgroundColor: colors.greenTint,
  },
  linkPress: { flex: 1, paddingVertical: 14 },
  linkText: { fontFamily: fonts.medium, fontSize: 14, color: colors.green, textDecorationLine: 'underline' },
  copiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  copiedText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.green },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: 20 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, paddingVertical: 0 },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: { width: 38, height: 38 },
  feedback: { fontFamily: fonts.medium, fontSize: 13, marginTop: 10 },
  error: { color: colors.error },
  success: { color: colors.green },
});
