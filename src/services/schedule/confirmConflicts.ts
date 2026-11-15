import { Alert } from 'react-native';
import { describeConflict, type Conflict } from './scheduleLogic';

export type ConflictChoice = 'cancel' | 'keep' | 'replace';

/**
 * Avisa que o novo item bate com a agenda e pergunta o que fazer:
 * - "Replace": o novo ganha (ver applyReplacement em scheduleLogic.ts)
 * - "Keep both": adiciona mesmo assim (os dois ficam lado a lado na semana)
 * - "Cancel": volta para o formulário
 * Sem conflitos, responde "keep" na hora.
 */
export function confirmConflicts(conflicts: Conflict[], itemName: string): Promise<ConflictChoice> {
  if (!conflicts.length) return Promise.resolve('keep');
  const list = conflicts
    .slice(0, 3)
    .map((c) => `• ${describeConflict(c)}`)
    .join('\n');
  const more = conflicts.length > 3 ? `\n…and ${conflicts.length - 3} more` : '';
  const title = conflicts.length === 1 ? `Overlaps with ${conflicts[0].label}` : `Overlaps with ${conflicts.length} items`;

  return new Promise((resolve) => {
    Alert.alert(
      title,
      `"${itemName}" happens at the same time as:\n${list}${more}\n\nDo you want to replace ${conflicts.length === 1 ? 'it' : 'them'}?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
        { text: 'Keep both', onPress: () => resolve('keep') },
        { text: 'Replace', style: 'destructive', onPress: () => resolve('replace') },
      ],
      { cancelable: true, onDismiss: () => resolve('cancel') },
    );
  });
}
