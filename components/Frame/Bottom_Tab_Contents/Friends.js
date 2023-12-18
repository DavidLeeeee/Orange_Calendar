import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  ScrollView,
  Platform,
} from "react-native";

import Bar_Friend from "../../Tab_Friends/B_Bar_Friend";
import FriendList from "../../Tab_Friends/B_FriendList";
import Bar_Group from "../../Tab_Friends/B_Bar_Group";
import GroupList from "../../Tab_Friends/B_GroupList";
import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";
import { firebase } from "../../../../Afirebaseconfig";
export default function Friends() {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <View
        style={[
          styles.container,
          signatureStyles ? signatureStyles.background : {},
          Platform.OS === "android" ? { paddingTop: 20 } : {},
        ]}
      >
        <View style={styles.groupContainer}>
          <Bar_Group />
          <View style={{ padding: 5 }}></View>
          <GroupList />
        </View>
        <View style={styles.separator} />
        <View style={styles.friendContainer}>
          <Bar_Friend />
          <FriendList />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 40,
    flex: 1,
    backgroundColor: "white", //여기에 적용하기
  },
  groupContainer: {
    height: "35%", // 화면의 1/2 비율
    marginBottom: 25,
  },
  friendContainer: {
    height: "65%", // 화면의 1/2 비율
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: "lightgrey",
    width: "100%", // 선의 길이를 90%로 조정
    alignSelf: "center", // 가운데 정렬
    marginBottom: 10, // 아래로 3만큼의 간격
  },
});

//View가 적어도 flex 1이나 width, height을 가져야 안에 scrollview든 뭐든 할 수 있다.
