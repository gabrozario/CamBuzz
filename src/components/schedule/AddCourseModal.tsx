import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { catalogService, normalizeCourseCode } from '../../services/schedule/catalogService';
import { confirmConflicts } from '../../services/schedule/confirmConflicts';
import { describeConflict } from '../../services/schedule/scheduleLogic';
import { useSchedule } from '../../services/schedule/ScheduleProvider';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import type { CatalogCourse, CatalogSection } from '../../types';
import { AppButton } from '../ui/AppButton';
import { DialogCard } from '../ui/DialogCard';
import { FieldGroup, FieldLabel, FormInput } from '../ui/FormField';
import { useToast } from '../ui/Toast';
import { SectionOption } from './SectionOption';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/**
 * Popup "Add Course" (Figma "Schedule · Add Course · Enter code" → "Section options"):
 * 1) digita o código e toca em "Find sections"; 2) toca na section (professor) e ela entra direto na agenda.
 */
export function AddCourseModal({ visible, onClose }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const { schedule, conflictsFor, addCourse } = useSchedule();
  const toast = useToast();

  const [code, setCode] = useState('');
  const [course, setCourse] = useState<CatalogCourse | null>(null);
  const [suggestions, setSuggestions] = useState<CatalogCourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Limpa tudo ao abrir.
  useEffect(() => {
    if (visible) {
      setCode('');
      setCourse(null);
      setSuggestions([]);
      setError(null);
      setSelectedId(null);
      setSaving(false);
    }
  }, [visible]);

  // Sugestões enquanto digita (só antes de achar o curso).
  useEffect(() => {
    if (course || code.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    let alive = true;
    catalogService.suggest(code).then((list) => alive && setSuggestions(list));
    return () => {
      alive = false;
    };
  }, [code, course]);

  const findSections = async (raw = code) => {
    setError(null);
    const found = await catalogService.findCourse(raw);
    if (!found) {
      setCourse(null);
      setError(`We couldn't find ${normalizeCourseCode(raw) || 'that course'}. Try a code like CS 1331.`);
      return;
    }
    setCode(found.code);
    setCourse(found);
    setSelectedId(null);
  };

  const current = course ? schedule.courses.find((x) => x.code === course.code) : undefined;

  const pickSection = async (section: CatalogSection) => {
    if (!course || saving) return;
    setSelectedId(section.id);
    if (current?.sectionId === section.id) {
      setError(`Section ${section.id} is already in your schedule.`);
      return;
    }
    setError(null);
    const conflicts = conflictsFor({ type: 'course', code: course.code, meetings: section.meetings });
    const choice = await confirmConflicts(conflicts, course.code);
    if (choice === 'cancel') {
      setSelectedId(null);
      return;
    }
    setSaving(true);
    const result = await addCourse(course, section.id, choice === 'replace' ? conflicts : undefined);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast(`${course.code} added to your schedule · ${section.instructor}`);
    onClose();
  };

  return (
    <DialogCard
      visible={visible}
      onClose={onClose}
      title="Add Course"
      subtitle={course ? 'Choose the section that fits your week.' : 'Find a course, then choose your section.'}
    >
      <FieldGroup>
        <FieldLabel>Course code</FieldLabel>
        <FormInput
          value={code}
          onChangeText={(t) => {
            setCode(t);
            setCourse(null);
            setError(null);
          }}
          placeholder="e.g. CS 1331"
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => findSections()}
          accessibilityLabel="Course code"
        />
        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            {suggestions.map((s) => (
              <Pressable
                key={s.code}
                onPress={() => findSections(s.code)}
                style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
              >
                <Text style={styles.suggestionCode}>{s.code}</Text>
                <Text style={styles.suggestionTitle} numberOfLines={1}>
                  {s.title}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </FieldGroup>

      {course ? (
        <>
          <Text style={styles.courseTitle}>
            {course.title} · {course.credits} credits
          </Text>
          <Text style={styles.sectionHeader}>AVAILABLE SECTIONS</Text>
          {course.sections.map((section) => {
            const conflicts = conflictsFor({ type: 'course', code: course.code, meetings: section.meetings });
            return (
              <SectionOption
                key={section.id}
                section={section}
                selected={selectedId === section.id}
                tag={current?.sectionId === section.id ? 'Your current section' : undefined}
                warning={conflicts.length ? `Overlaps ${describeConflict(conflicts[0])}` : undefined}
                onPress={() => pickSection(section)}
              />
            );
          })}
          <Text style={[styles.note, error && styles.error]}>
            {error ??
              (saving
                ? 'Adding to your schedule…'
                : current
                  ? `You're in Section ${current.sectionId}. Pick another to switch.`
                  : 'Choose the section that works for you.')}
          </Text>
        </>
      ) : (
        <>
          {error && <Text style={[styles.note, styles.error]}>{error}</Text>}
          <AppButton label="Find sections" onPress={() => findSections()} style={styles.findButton} />
        </>
      )}
    </DialogCard>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    suggestions: { marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: c.fieldBorder, overflow: 'hidden' },
    suggestion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.card,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.fieldBorder,
    },
    suggestionCode: { fontFamily: fonts.semibold, fontSize: 14, color: c.text },
    suggestionTitle: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: c.muted },
    courseTitle: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 8 },
    sectionHeader: { fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 0.4, color: c.muted, marginTop: 24 },
    note: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 20 },
    error: { color: c.error },
    findButton: { marginTop: 32 },
  });
