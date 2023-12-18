import React from "react";
import { StyleSheet, Text, View, Button, Dimensions } from "react-native";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3; //위젯의 크기 지정을 위한 변수
export default function MonthlyScheduleComponent({
  widgets,
  setWidgets,
  selectedGroup,
}) {
  return (
    <View style={styles.widgetBox}>
      <Text>MonthlyScheduleComponent</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  ViewBox: {
    flexDirection: "row", // 가로 방향으로 아이템 배치
    flexWrap: "wrap", // 아이템이 화면 너비를 초과하면 다음 행으로 이동
    backgroundColor: "white",
  },
  widgetBox: {
    width: itemWidth,
    height: itemWidth, // height는 width와 동일하게 설정1
    backgroundColor: "rgba(200, 200, 200, 0.5)",
    margin: (width * 0.05 - 8) / 2, // 각 요소 사이의 간격 조정
    borderRadius: 10, // 디자인 향상을 위한 라운드 처리
  },
});
