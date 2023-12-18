import React, { useEffect, useState } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Image } from "expo-image";

const Loading = ({ onFinish }) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    const timeout = setTimeout(() => {
      // 1초 후 onFinish 함수 호출
      onFinish();
    }, 1000);

    return () => clearTimeout(timeout);
  }, [onFinish]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require("../assets/Logo.png")}
        style={{ width: 150, height: 150 }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  image: {
    width: 200, // 이미지의 원하는 크기로 설정
    height: 200, // 이미지의 원하는 크기로 설정
  },
});

export default Loading;
