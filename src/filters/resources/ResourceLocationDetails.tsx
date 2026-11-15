import { CreditCard, MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { getBuilding } from '../../../data';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { fonts, radius, useAppTheme, useThemedStyles, type Palette } from '../../theme';
import type { ResourceCategory, ResourceLocation } from '../../types';

interface Props {
  location: ResourceLocation;
  category?: ResourceCategory;
}

/**
 * Detalhe de um recurso SEM página de ocupação (ex.: impressoras P1–P27):
 * categoria, onde fica (andar/sala de cada ponto) e se precisa de BuzzCard.
 * Aparece ao tocar no pino no mapa ou no item da lista.
 */
export function ResourceLocationDetails({ location, category }: Props) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const building = (() => {
    try {
      return getBuilding(location.buildingId);
    } catch {
      return null; // recurso num prédio que não está em buildings.json
    }
  })();

  return (
    <SheetScrollView contentContainerStyle={styles.content}>
      <View style={styles.badgeRow}>
        <View style={[styles.code, { backgroundColor: category?.color ?? colors.ink }]}>
          <Text style={styles.codeText}>{location.code}</Text>
        </View>
        <Text style={[styles.category, { color: category?.color ?? colors.muted }]}>{category?.name ?? 'Resource'}</Text>
      </View>

      {!!location.details?.length && (
        <>
          <Text style={styles.sectionLabel}>WHERE TO FIND IT</Text>
          {location.details.map((d, i) => (
            <View key={i} style={styles.detailRow}>
              <View style={styles.bullet} />
              <Text style={styles.detailText}>{d}</Text>
            </View>
          ))}
        </>
      )}

      {location.buzzCardRestricted && (
        <View style={styles.notice}>
          <CreditCard size={18} color={colors.gold} strokeWidth={1.8} />
          <Text style={styles.noticeText}>BuzzCard access required</Text>
        </View>
      )}

      {building && (
        <View style={styles.whereRow}>
          <MapPin size={16} color={colors.muted} strokeWidth={1.8} />
          <Text style={styles.whereText}>{building.name}</Text>
        </View>
      )}
    </SheetScrollView>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    content: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    code: { minWidth: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    codeText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.white },
    category: { fontFamily: fonts.semibold, fontSize: 14 },
    sectionLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6, color: colors.muted, marginTop: 22, marginBottom: 8 },
    detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.subtle, marginTop: 7 },
    detailText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.ink, lineHeight: 21 },
    notice: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 18,
      padding: 12,
      borderRadius: radius.md,
      backgroundColor: colors.activeTab,
    },
    noticeText: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
    whereRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
    whereText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, color: colors.muted },
  });
