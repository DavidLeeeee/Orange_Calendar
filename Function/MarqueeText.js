import React, { useState, useRef, useEffect } from "react";
import { View, Text, Animated } from "react-native";

const MarqueeText = ({ text, containerStyle, textStyle, duration = 3000 }) => {
  const [textWidth, setTextWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log("textWidth:", textWidth);
    if (textWidth > 80) {
      animateText();
    }
  }, [textWidth]);

  const animateText = () => {
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: -textWidth + 5 * text.length,
        //toValue: containerWidth - textWidth + text.length, // 약간의 여유공간을 위해 -5를 추가했습니다.
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration,
        useNativeDriver: true,
      }),
    ]).start(() => animateText());
  };

  return (
    <Animated.View
      style={[
        containerStyle,
        {
          transform: [{ translateX: animatedValue }],
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Text
        style={textStyle}
        onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
      >
        {text}
      </Text>
    </Animated.View>
  );
};

export default MarqueeText;
