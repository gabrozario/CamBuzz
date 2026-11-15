import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFriends } from '../../services/friends/FriendsProvider';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import { AppButton } from '../ui/AppButton';
import { DialogCard } from '../ui/DialogCard';
import { FieldGroup, FieldLabel, FormInput } from '../ui/FormField';
import { useToast } from '../ui/Toast';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** Popup "Edit account" (Figma "Settings · Edit account"): nome + email, "Save changes" / "Cancel". */
export function EditAccountModal({ visible, onClose }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { me, updateProfile } = useFriends();
  const toast = useToast();
  const [name, setName] = useState(me.name);
  const [email, setEmail] = useState(me.email);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(me.name);
      setEmail(me.email);
      setError(null);
      setSaving(false);
    }
  }, [visible, me]);

  const save = async () => {
    setSaving(true);
    const err = await updateProfile({ name, email });
    setSaving(false);
    if (err) return setError(err);
    toast('Account updated');
    onClose();
  };

  return (
    <DialogCard visible={visible} onClose={onClose} showReturn={false} title="Edit account">
      <FieldGroup style={styles.firstGroup}>
        <FieldLabel>Name</FieldLabel>
        <FormInput value={name} onChangeText={setName} autoComplete="name" accessibilityLabel="Name" />
      </FieldGroup>
      <FieldGroup>
        <FieldLabel>Account email</FieldLabel>
        <FormInput
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          accessibilityLabel="Account email"
        />
      </FieldGroup>
      {error && <Text style={styles.error}>{error}</Text>}
      <View style={styles.buttons}>
        <AppButton label="Save changes" onPress={save} loading={saving} style={styles.save} />
        <AppButton label="Cancel" variant="soft" onPress={onClose} style={styles.cancel} />
      </View>
    </DialogCard>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    firstGroup: { marginTop: 24 },
    error: { fontFamily: fonts.regular, fontSize: 13, color: c.error, marginTop: 12 },
    buttons: { flexDirection: 'row', gap: 12, marginTop: 36 },
    save: { flex: 2 },
    cancel: { flex: 1 },
  });
