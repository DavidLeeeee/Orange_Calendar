import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  Pressable,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";

const screenWidth = Dimensions.get("window").width;

export default AlarmTab = (props) => {
  const isfriendword = "친구 추가 알림";
  const isfriendaccept = "친구 알림";

  const isGroupappliedword = "그룹 추가 알림"; // 그룹명
  const isGroupapplyword = "그룹 신청 알림";
  const isGroupjoinword = "그룹 참가 알림";
  const isGroupoutword = "그룹 탈퇴 알림";

  const isScheduleword = "일정 알림"; // 그룹명, 등록자, 일정(날짜, 내용)
  const isfriendTouch = "콕 찌르기 알림";
  const isFirstLogin = "가입 축하 알림";
  const isInform = "공지 알림";

  let content = null;

  if (props.match === isfriendword) {
    // 친구 추가 알림에 대한 UI
    content = (
      <View>
        <Text style={styles.text}>{props.name}</Text>
        <Text>친구를 신청하셨습니다.</Text>
      </View>
    );
  } else if (props.match === isGroupappliedword) {
    if (props.accept) {
      content = (
        <View>
          <Text style={styles.text}>{props.name}</Text>
          <Text>그룹에 참가되셨습니다.</Text>
        </View>
      );
    } else {
      content = (
        <View>
          <Text style={styles.text}>{props.name}</Text>
          <Text>그룹에서 참가를 거절했습니다.</Text>
        </View>
      );
    }
  } else if (props.match === isGroupapplyword) {
    // 그룹 신청 알림에 대한 UI
    content = (
      <View>
        <Text style={styles.text}>{props.name}</Text>
        <Text>{props.writer} 님이 참가를 신청했습니다.</Text>
      </View>
    );
  } else if (props.match === isGroupjoinword) {
    // 그룹 신청 알림에 대한 UI
    content = (
      <View>
        <Text style={styles.text}>{props.name}</Text>
        <Text>{props.writer} 님이 그룹에 참가했습니다.</Text>
      </View>
    );
  } else if (props.match === isScheduleword) {
    // 일정 추가 알림에 대한 UI
    content = (
      <View>
        <Text style={styles.text}>{props.name}</Text>
        <Text>{props.writer} 님으로부터의 일정 알림.</Text>
        <Text>일정 내용: {props.schedule}</Text>
        <Text>작성일: {props.date}</Text>
      </View>
    );
  } else if (props.match === isfriendaccept) {
    if (props.accept) {
      content = (
        <View>
          <Text style={styles.text}>{props.name}</Text>
          <Text>친구를 수락하셨습니다.</Text>
        </View>
      );
    } else {
      content = (
        <View>
          <Text style={styles.text}>{props.name}</Text>
          <Text>친구를 거절하셨습니다.</Text>
        </View>
      );
    }
  } else if (props.match === isGroupoutword) {
    if (props.force) {
      content = (
        <View>
          <Text style={styles.text}>{props.name}</Text>
          <Text>그룹에서 강퇴되셨습니다.</Text>
        </View>
      );
    } else {
      content = (
        <View>
          <Text style={styles.text}>{props.name}</Text>
          <Text>{props.writer} 님이 그룹을 탈퇴하셨습니다.</Text>
        </View>
      );
    }
  } else if (props.match === isfriendTouch) {
    content = (
      <View>
        <Text style={styles.text}>{props.name}</Text>
        <Text>회원님을 콕 찔렀습니다.</Text>
      </View>
    );
  } else if (props.match === isFirstLogin) {
    content = (
      <View>
        <Text style={styles.text}>{props.name}님의 가입을 환영합니다!</Text>
        <Text>Orange와 일정 관리를 시작해보세요!</Text>
        <Text>회원님을 나타내는 프로필 사진을 설정해주세요.</Text>
      </View>
    );
  } else if (props.match === isInform) {
    content = (
      <View>
        <Text style={styles.text}>공지 알림</Text>
        <Text>{props.schedule}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        {props.match === isFirstLogin || props.match === isInform ? (
          <Image
            style={styles.orangeimage}
            source={require("../../assets/Logo.png")}
          />
        ) : (
          <Image
            style={styles.image}
            source={{
              uri: props.imgurl || "null", // groupimg를 source로 사용
            }}
          />
        )}
        {content}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth - 80,
    maxWidth: "100%",
    minHeight: 50, // 기본 최소 높이를 60으로 설정
    backgroundColor: "white",
    padding: 10,
    justifyContent: "center",
    flex: 1, // 필요에 따라 늘어날 수 있게 flex 설정
  },
  innerContainer: {
    maxWidth: "80%",
    flexDirection: "row",
    alignItems: "center", // Vertically center the text and the image
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderColor: "black",
    borderWidth: 1,
    marginRight: 10, // Add some space between the image and the text
  },
  orangeimage: {
    width: 40,
    height: 40,
    borderRadius: 50,
    borderColor: "black",
  },
  text: {
    fontWeight: "bold",
    fontSize: 15,
    flexShrink: 1, // Allow the text to shrink if needed
  },
});
