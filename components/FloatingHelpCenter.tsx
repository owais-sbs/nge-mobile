import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingHelpCenter(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Pressable
        onPress={() => router.push('/faq')}
        style={({ pressed }) => [
          styles.fab,
          // Move it up so it aligns better with other floating buttons (e.g. the + add-post FAB)
          { bottom: Math.max(88, insets.bottom + 88) },
          pressed && styles.fabPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Help Center"
        hitSlop={10}
      >
        <Feather name="help-circle" size={18} color="#000" />
        <Text style={styles.fabText}>Help</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFC109',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  fabText: {
    color: '#000',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
});

