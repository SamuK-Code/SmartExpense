import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BADGE_SIZES, BORDER_RADIUS, FONT_WEIGHTS } from '../constants/DesignSystem';

const Badge = ({
  icon,
  text,
  color = '#4CAF50',
  size = 'md',
  backgroundColor,
  style
}) => {
  const sizeConfig = BADGE_SIZES[size];
  const bgColor = backgroundColor || (color + '26'); // 15% opacity

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          borderRadius: BORDER_RADIUS.tight,
          backgroundColor: bgColor,
          gap: sizeConfig.gap,
        },
        style,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={sizeConfig.icon}
          color={color}
        />
      )}
      <Text
        style={{
          fontSize: sizeConfig.fontSize,
          fontWeight: FONT_WEIGHTS.semibold,
          color: color,
        }}
      >
        {text}
      </Text>
    </View>
  );
};

export default Badge;
