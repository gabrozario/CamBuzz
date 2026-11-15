import { ChevronLeft } from 'lucide-react-native';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { FoodItem, FoodLocation } from '../../types';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Saturday, Nov 14" (feito à mão para não depender do Intl do Android). */
function todayLabel(d = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

interface HeaderProps {
  location: FoodLocation;
  onBack: () => void;
}

/** Cabeçalho fixo do detalhe: "‹ Food options", nome do local e "Dining hall · North Avenue". */
export function FoodDetailsHeader({ location, onBack }: HeaderProps) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={styles.backRow}
        accessibilityRole="button"
        accessibilityLabel="Back to food options"
      >
        <ChevronLeft size={20} color={colors.ink} strokeWidth={2} />
        <Text style={styles.backLabel}>Food options</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={2}>
        {location.name}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {location.kind} · {location.area}
      </Text>
    </View>
  );
}

/** Página do local: cardápio do dia por seção (Breakfast/Lunch/Dinner...) com a nutrição de cada item. */
export function FoodDetails({ location }: { location: FoodLocation }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <SheetScrollView contentContainerStyle={styles.content}>
      <Text style={styles.menuTitle}>Menu for today</Text>
      <Text style={styles.menuSubtitle}>
        {todayLabel()} · {location.menuNote}
      </Text>
      <Text style={styles.scrollHint} numberOfLines={1}>
        {location.scrollHint}
      </Text>

      {location.menu.map((section) => (
        <View key={section.id}>
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{section.label}</Text>
          </View>
          {section.items.map((item, idx) => (
            <Fragment key={item.id}>
              <MenuItemRow item={item} />
              {idx < section.items.length - 1 && <View style={styles.divider} />}
            </Fragment>
          ))}
        </View>
      ))}

      {/* Rodapé dentro da lista: algo "fixo" embaixo ficaria fora da tela com a aba em 35%. */}
      <Text style={styles.footerNote}>Example menu & nutrition</Text>
    </SheetScrollView>
  );
}

function MenuItemRow({ item }: { item: FoodItem }) {
  const styles = useThemedStyles(makeStyles);
  const stats = [
    { value: `${item.calories}`, label: 'Calories' },
    { value: `${item.protein} g`, label: 'Protein' },
    { value: `${item.carbs} g`, label: 'Carbs' },
    { value: `${item.sugars} g`, label: 'Sugars' },
  ];
  return (
    <View style={styles.item}>
      <Text style={styles.itemName}>{item.name}</Text>
      <Text style={styles.itemMeta}>
        {item.portion} · {item.tag}
      </Text>
      <View style={styles.statsRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -6, marginBottom: 8 },
  backLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted, marginTop: 4 },

  content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },
  menuTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.ink },
  menuSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  scrollHint: { fontFamily: fonts.medium, fontSize: 12, color: colors.gold, marginTop: 6, marginBottom: 14 },

  banner: {
    backgroundColor: colors.activeTab,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  bannerText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.gold },

  item: { paddingVertical: 12 },
  itemName: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  itemMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 3 },
  statsRow: { flexDirection: 'row', marginTop: 10 },
  stat: { flex: 1 },
  statValue: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  statLabel: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.divider },

  footerNote: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 16 },
});
