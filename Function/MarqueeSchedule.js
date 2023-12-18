import React, { useRef, useEffect, useState } from "react";
import { Text, View, Animated, Easing, Dimensions } from "react-native";

const MarqueeSchedule = ({ content, style }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [textWidth, setTextWidth] = useState(0);
  const cellWidth = (Dimensions.get("window").width / 7) * 0.8; // Consider the cell width including the paddingRight value

  useEffect(() => {
    if (textWidth > cellWidth) {
      // Start the animation only if the text width exceeds the cell width
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: cellWidth - textWidth,
            duration: 5000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [textWidth]);

  return (
    <View
      style={{
        overflow: "scroll",
        // width: cellWidth,
        width: "auto",
        height: 9,
      }}
    >
      <Animated.Text
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          console.log("Text width:", width); // 로그 추가
          setTextWidth(width);
        }}
        style={[
          style,
          {
            transform: [{ translateX: animatedValue }],
          },
        ]}
      >
        {content}
      </Animated.Text>
    </View>
  );
};

export default MarqueeSchedule;
