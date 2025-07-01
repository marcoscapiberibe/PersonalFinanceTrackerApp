import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CategoryIconProps {
  category: string;
  size?: number;
  color?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 24,
  color,
}) => {
  const getIconName = (category: string): string => {
    const icons: Record<string, string> = {
      food: 'restaurant',
      transport: 'car',
      entertainment: 'game-controller',
      health: 'medical',
      salary: 'briefcase',
      freelance: 'laptop',
      shopping: 'bag',
      bills: 'receipt',
      rent: 'home',
      other: 'ellipsis-horizontal',
    };
    return icons[category] || 'help-circle';
  };

  const getIconColor = (category: string): string => {
    const colors: Record<string, string> = {
      food: '#FF5722',
      transport: '#795548',
      entertainment: '#E91E63',
      health: '#009688',
      salary: '#4CAF50',
      freelance: '#2196F3',
      shopping: '#9C27B0',
      bills: '#607D8B',
      rent: '#8BC34A',
      other: '#9E9E9E',
    };
    return color || colors[category] || '#9E9E9E';
  };

  return (
    <View style={[styles.container, { backgroundColor: getIconColor(category) }]}>
      <Ionicons
        name={getIconName(category) as any}
        size={size}
        color="#FFFFFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
