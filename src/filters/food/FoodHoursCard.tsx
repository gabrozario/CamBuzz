import { ChevronDown, ChevronUp, CircleCheck, CircleX, MapPin } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { FoodLocation } from '../../types';
import { todayISO, weekdayOf } from '../../utils/dates';
import { nowTime } from '../../utils/time';
import { formatDayHours, openStatus, otherDays, weekdayName } from './foodHours';

/**
 * Horário + pagamento de um local (dados reais de dining.gatech.edu):
 * hoje em destaque ("Open now · until 10 PM"), os outros dias pequenos embaixo,
 * e se aceita Dining Dollars / BuzzCard Funds.
 */
export function FoodHoursCard({ location, compact = false }: { location: FoodLocation; compact?: boolean }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  // Compacto (dining halls): só "Open now · until…" + horários da semana escondidos, para o cardápio aparecer logo.
  const [showWeek, setShowWeek] = useState(!compact);
  const { hours, payments } = location;
  if (!hours) return null;

  const today = todayISO();
  const day = weekdayOf(today);
  const status = openStatus(hours, today, nowTime());

  const paymentRows = payments
    ? [
        { label: 'Dining Dollars', ok: payments.diningDollars },
        { label: 'BuzzCard Funds', ok: payments.buzzcardFunds },
      ]
    : [];

  return (
    <View>
      {/* Hoje, em destaque */}
      <View style={[styles.statusPill, { backgroundColor: status.open ? colors.greenSoft : colors.divider }]}>
        <View style={[styles.statusDot, { backgroundColor: status.open ? colors.green : colors.error }]} />
        <Text style={[styles.statusText, { color: status.open ? colors.green : colors.error }]}>{status.label}</Text>
      </View>
      {!compact && (
        <>
          <Text style={styles.todayLabel}>TODAY · {weekdayName(day).toUpperCase()}</Text>
          <Text style={styles.todayHours}>{formatDayHours(hours[day])}</Text>
        </>
      )}
      {location.hoursNote && <Text style={styles.hoursNote}>{location.hoursNote}</Text>}

      {compact && (
        <Pressable
          onPress={() => setShowWeek(!showWeek)}
          hitSlop={8}
          style={styles.weekToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: showWeek }}
        >
          <Text style={styles.weekToggleText}>{showWeek ? 'Hide weekly hours' : 'See weekly hours'}</Text>
          {showWeek ? (
            <ChevronUp size={14} color={colors.muted} strokeWidth={2} />
          ) : (
            <ChevronDown size={14} color={colors.muted} strokeWidth={2} />
          )}
        </Pressable>
      )}

      {/* Outros dias, pequenos */}
      {showWeek && (
      <View style={styles.week}>
        {otherDays(today).map((d) => (
          <View key={d} style={styles.dayRow}>
            <Text style={styles.dayName}>{weekdayName(d)}</Text>
            <Text style={[styles.dayHours, !hours[d].length && styles.closed]}>{formatDayHours(hours[d])}</Text>
          </View>
        ))}
      </View>
      )}

      {paymentRows.length > 0 && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>PAYMENT</Text>
          {paymentRows.map((p) => (
            <View key={p.label} style={styles.payRow}>
              {p.ok ? (
                <CircleCheck size={20} color={colors.green} strokeWidth={2} />
              ) : (
                <CircleX size={20} color={colors.error} strokeWidth={2} />
              )}
              <Text style={styles.payLabel}>{p.label}</Text>
              <Text style={[styles.payValue, { color: p.ok ? colors.green : colors.error }]}>
                {p.ok ? 'Accepted' : 'Not accepted'}
              </Text>
            </View>
          ))}
          {location.paymentNote && <Text style={styles.small}>{location.paymentNote}</Text>}
        </>
      )}

      {!!location.address && showWeek && (
        <View style={styles.addressRow}>
          <MapPin size={16} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.address}>{location.address}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    statusDot: { width: 8, height: 8, borderRadius: 4 },
    statusText: { fontFamily: fonts.semibold, fontSize: 13 },
    todayLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6, color: colors.muted, marginTop: 16 },
    todayHours: { fontFamily: fonts.bold, fontSize: 24, color: colors.ink, marginTop: 4 },
    hoursNote: { fontFamily: fonts.medium, fontSize: 12, color: colors.gold, marginTop: 6 },
    week: { marginTop: 14, gap: 6 },
    weekToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginTop: 10 },
    weekToggleText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted, textDecorationLine: 'underline' },
    dayRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    dayName: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
    dayHours: { flexShrink: 1, textAlign: 'right', fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
    closed: { color: colors.subtle },
    divider: { height: 1, backgroundColor: colors.divider, marginVertical: 18 },
    sectionLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6, color: colors.muted, marginBottom: 6 },
    payRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
    payLabel: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
    payValue: { fontFamily: fonts.medium, fontSize: 13 },
    small: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, marginTop: 4 },
    addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18 },
    address: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  });
