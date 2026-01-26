import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function FloatingHelpCenter(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpanded = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleHelpPress = () => {
    router.push('/faq');
    // Reset to collapsed state after navigation
    setIsExpanded(false);
    Animated.timing(animation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const buttonWidth = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [44, 88], // From full icon size to full button width
  });

  const leftPosition = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 16], // Start at edge (0) so icon is fully visible, then expand to normal position
  });

  const textOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const contentJustification = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1], // 0 = flex-start (left), 1 = center
  });

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          styles.fab,
          { 
            bottom: Math.max(88, insets.bottom + 88),
            width: buttonWidth,
            left: leftPosition,
          }
        ]}
      >
        <Pressable
          onPress={isExpanded ? handleHelpPress : toggleExpanded}
          style={({ pressed }) => [
            styles.fabContent,
            pressed && styles.fabPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Help Center"
          hitSlop={10}
        >
          <View style={styles.iconContainer}>
            <Feather name="help-circle" size={18} color="#000" />
          </View>
          <Animated.View style={{ opacity: textOpacity }}>
            <Text style={styles.fabText}>Help</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFC109',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    overflow: 'hidden',
  },
  fabContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Always start from left
    gap: 8,
    paddingLeft: 12, // Ensure icon has space from left edge
    paddingRight: 14,
  },
  iconContainer: {
    width: 20, // Fixed width for icon to ensure it's always visible
    alignItems: 'center',
    justifyContent: 'center',
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

