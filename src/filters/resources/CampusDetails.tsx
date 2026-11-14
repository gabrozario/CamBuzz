import { BookOpen, ChevronLeft, Dumbbell } from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SheetScrollView } from '../../components/sheet/SheetScrollView';
import { colors, fonts, radius } from '../../theme';
import type { BuildingOccupancyDetails, FloorSpaceOccupancy, OccupancyStatus } from '../../types';

interface HeaderProps {
  buildingName: string;
  onBack: () => void;
}

/** Cabeçalho fixo do detalhe do prédio (substitui o título do FilterSheet via customHeader). */
export function CampusDetailsHeader({ buildingName, onBack }: HeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        style={styles.backRow}
        accessibilityRole="button"
        accessibilityLabel="Back to resources"
      >
        <ChevronLeft size={22} color={colors.ink} strokeWidth={2} />
        <Text style={styles.backLabel}>Resources</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {buildingName}
      </Text>
    </View>
  );
}

function getStatusColor(status: OccupancyStatus): string {
  switch (status) {
    case 'Busy':
      return '#A05A42'; // Tom terracota/avermelhado do Figma
    case 'Moderate':
      return colors.gold;
    case 'Quiet':
      return colors.green;
  }
}

/** Visualização detalhada do prédio (ocupação por andar via Waitz). */
export function CampusDetails({ details }: { details: BuildingOccupancyDetails }) {
  const isClough = details.buildingId === 'culc';
  const isCrc = details.buildingId === 'crc';

  return (
    <SheetScrollView contentContainerStyle={styles.content}>
      {/* Imagem de Clough Commons ou banner Waitz para os demais prédios */}
      {isClough ? (
        <>
          <View style={styles.imageContainer}>
            <Image
              source={require('../../../assets/clough-commons.png')}
              style={styles.image}
              resizeMode="cover"
            />
          </View>
          <Text style={styles.caption}>{details.photoAttribution}</Text>
        </>
      ) : (
        <View style={styles.waitzCard}>
          <View style={styles.waitzIconBox}>
            {isCrc ? (
              <Dumbbell size={22} color={colors.blue} strokeWidth={2} />
            ) : (
              <BookOpen size={22} color={colors.gold} strokeWidth={2} />
            )}
          </View>
          <View style={styles.waitzTextBox}>
            <View style={styles.liveIndicatorRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>Live Waitz Occupancy</Text>
            </View>
            <Text style={styles.waitzSub}>{details.photoAttribution}</Text>
          </View>
        </View>
      )}

      {/* Seção de ocupação por andar / área */}
      <Text style={styles.sectionTitle}>
        {isCrc ? 'How busy is each area?' : 'How busy is each floor?'}
      </Text>
      <Text style={styles.sectionSubtitle}>{details.subtitle}</Text>

      {details.floors.map((floor) => (
        <View key={`${floor.floor}-${floor.label}`} style={styles.floorBlock}>
          <View style={styles.floorBanner}>
            <Text style={styles.floorBannerText}>{floor.label}</Text>
          </View>

          {floor.spaces.map((space: FloorSpaceOccupancy, idx: number) => {
            const barColor = getStatusColor(space.status);
            return (
              <View key={space.id}>
                <View style={styles.spaceRow}>
                  <Text style={styles.spaceName}>{space.name}</Text>
                  <Text style={styles.spaceStatus}>
                    {space.status} · {space.percentage}%
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.bar, { width: `${space.percentage}%`, backgroundColor: barColor }]} />
                </View>
                {idx < floor.spaces.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>
      ))}

      <Text style={styles.footerNote}>
        {isCrc ? 'Scroll to explore all workout areas ↓' : 'Scroll to explore all floors and spaces ↓'}
      </Text>
    </SheetScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 8 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -6, marginBottom: 4 },
  backLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.ink },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.ink },
  content: { paddingHorizontal: 24, paddingTop: 6, paddingBottom: 40 },
  imageContainer: {
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.divider,
  },
  image: {
    width: '100%',
    height: 180,
  },
  waitzCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: '#F3F1EA',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  waitzIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitzTextBox: {
    flex: 1,
    gap: 2,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveLabel: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  waitzSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.subtle,
    marginTop: 6,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: colors.ink,
    marginTop: 18,
  },
  sectionSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 10,
  },
  floorBlock: {
    marginBottom: 12,
  },
  floorBanner: {
    backgroundColor: '#F0EDE4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    marginBottom: 10,
  },
  floorBannerText: {
    fontFamily: fonts.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  spaceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  spaceName: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  spaceStatus: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E6E4DC',
    marginTop: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 4,
  },
  footerNote: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 18,
    marginBottom: 20,
  },
});
