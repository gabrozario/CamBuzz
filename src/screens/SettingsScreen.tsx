import { ArrowRight, LogIn, LogOut } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EditAccountModal } from '../components/settings/EditAccountModal';
import { ThemeSwitch } from '../components/settings/ThemeSwitch';
import { useAuth } from '../services/auth/AuthProvider';
import { useFriends } from '../services/friends/FriendsProvider';
import { fonts, useAppTheme, type AppColors } from '../theme';

interface Props {
  onBack: () => void;
}

/** Tela "Settings" (Figma "Settings · Light mode" / "Dark mode"): sua conta + modo claro/escuro. */
export function SettingsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { c, isDark, setMode } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { me } = useFriends();
  const [editing, setEditing] = useState(false);
  const { status, logOut } = useAuth();
  const isGuest = status === 'guest';

  // Sair da conta (ou do modo convidado) volta para a tela de boas-vindas.
  const confirmLogOut = () =>
    Alert.alert('Log out?', 'You can log back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: () => logOut() },
    ]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Back to map"
          >
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>YOUR ACCOUNT</Text>
        {isGuest ? (
          <>
            <Text style={styles.name}>Guest</Text>
            <Text style={styles.email}>Log in to save your schedule</Text>
            <Pressable
              onPress={() => logOut()}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.editText}>Log in or sign up</Text>
              <LogIn size={20} color={c.accentSoftText} strokeWidth={2} />
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.name}>{me.name}</Text>
            <Text style={styles.email}>{me.email}</Text>
            <Pressable
              onPress={() => setEditing(true)}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
              accessibilityRole="button"
            >
              <Text style={styles.editText}>Edit name & email</Text>
              <ArrowRight size={20} color={c.accentSoftText} strokeWidth={2} />
            </Pressable>
          </>
        )}

        <Text style={[styles.sectionLabel, styles.appearanceLabel]}>APPEARANCE</Text>
        <View style={styles.card}>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>Dark or Light Mode</Text>
            <Text style={styles.cardValue}>{isDark ? 'Dark mode' : 'Light mode'}</Text>
          </View>
          <ThemeSwitch
            value={isDark}
            onChange={(on) => setMode(on ? 'dark' : 'light')}
            accessibilityLabel="Dark mode"
          />
        </View>
        <Text style={styles.note}>Choose the look that feels right for you.</Text>

        {!isGuest && (
          <Pressable
            onPress={confirmLogOut}
            style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <LogOut size={20} color={c.error} strokeWidth={2} />
            <Text style={styles.logOutText}>Log out</Text>
          </Pressable>
        )}
      </ScrollView>

      <EditAccountModal visible={editing} onClose={() => setEditing(false)} />
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.page },
    content: { paddingHorizontal: 22 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontFamily: fonts.semibold, fontSize: 19, color: c.text },
    back: { backgroundColor: c.card, borderRadius: 16, paddingHorizontal: 20, height: 44, justifyContent: 'center' },
    backText: { fontFamily: fonts.semibold, fontSize: 15, color: c.accentSoftText },
    pressed: { opacity: 0.7 },
    sectionLabel: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.4, color: c.muted, marginTop: 52 },
    name: { fontFamily: fonts.bold, fontSize: 34, color: c.text, marginTop: 14, letterSpacing: -0.5 },
    email: { fontFamily: fonts.regular, fontSize: 16, color: c.muted, marginTop: 6 },
    editButton: {
      marginTop: 26,
      height: 50,
      borderRadius: 18,
      backgroundColor: c.accentSoft,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
    },
    editText: { fontFamily: fonts.semibold, fontSize: 15, color: c.accentSoftText },
    appearanceLabel: { marginTop: 60 },
    card: {
      marginTop: 22,
      backgroundColor: c.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingHorizontal: 18,
      paddingVertical: 22,
      minHeight: 110,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    cardText: { gap: 10 },
    cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: c.text },
    cardValue: { fontFamily: fonts.regular, fontSize: 15, color: c.muted },
    note: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 14, marginLeft: 2 },
    logOut: {
      marginTop: 48,
      height: 50,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.cardBorder,
      backgroundColor: c.card,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    logOutText: { fontFamily: fonts.semibold, fontSize: 15, color: c.error },
  });
