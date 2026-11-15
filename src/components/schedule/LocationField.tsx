import { MapPin } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getBuilding } from '../../../data';
import { fonts, useAppTheme, type AppColors } from '../../theme';
import { suggestBuildings } from '../../utils/buildingSearch';
import { FormInput } from '../ui/FormField';

interface Props {
  value: string;
  buildingId?: string;
  onChange: (text: string) => void;
  /** Tocou numa sugestão: preenche com o nome do prédio. */
  onPickBuilding: (buildingId: string) => void;
}

/** Campo "Location": texto livre + sugestões de prédios da GT (com prédio, o evento aparece no mapa). */
export function LocationField({ value, buildingId, onChange, onPickBuilding }: Props) {
  const { c } = useAppTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const suggestions = buildingId ? [] : suggestBuildings(value);

  return (
    <View>
      <FormInput
        value={value}
        onChangeText={onChange}
        placeholder="Add a place or room"
        accessibilityLabel="Location"
      />
      {buildingId ? (
        <View style={styles.matched}>
          <MapPin size={14} color={c.success} strokeWidth={2} />
          <Text style={styles.matchedText}>{getBuilding(buildingId).name} · shows on your campus map</Text>
        </View>
      ) : (
        suggestions.length > 0 && (
          <View style={styles.chips}>
            {suggestions.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => onPickBuilding(b.id)}
                style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={`Use ${b.name}`}
              >
                <MapPin size={13} color={c.accentSoftText} strokeWidth={2} />
                <Text style={styles.chipText}>{b.name}</Text>
              </Pressable>
            ))}
          </View>
        )
      )}
    </View>
  );
}

const makeStyles = (c: AppColors) =>
  StyleSheet.create({
    matched: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    matchedText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 12, color: c.success },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: c.accentSoft,
    },
    chipText: { fontFamily: fonts.medium, fontSize: 12, color: c.accentSoftText },
  });
