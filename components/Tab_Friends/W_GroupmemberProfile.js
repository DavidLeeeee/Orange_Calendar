import React from "react";
import { Image, View, Text, TouchableOpacity, Alert } from "react-native";
import { firebase } from "../../../Afirebaseconfig";
import * as Notifications from "expo-notifications";

//GroupmemberList에서 호출함.
export default GroupmemberProfile = (props) => {
  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  //멤버 삭제 함수, 그룹에 있는 데이터, 사용자에 있는 그룹 데이터 두 개 삭제
  const deleteMember = async (name) => {
    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const groupimg = (await GroupimgRef).data().groupimg;

    Alert.alert(
      "강퇴 확인",
      name + "님을 강퇴하시겠습니까?",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "확인",
          onPress: async () => {
            await db
              .collection("Group calendar")
              .doc(props.selectedGroup)
              .collection("그룹원")
              .doc(props.email)
              .delete();

            await db
              .collection("users")
              .doc(props.email)
              .collection("Group")
              .doc(props.selectedGroup)
              .delete();

            await db
              .collection("users")
              .doc(props.email)
              .collection("알림")
              .doc(props.selectedGroup + "에서 그룹 탈퇴 알림")
              .set({
                name: props.selectedGroup,
                profileImageUrl: groupimg,
                force: true, //강제성
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                match: "그룹 탈퇴 알림",
              });
          },
        },
      ],
      { cancelable: false }
    );
  };

  async function sendPushNotification(expoPushToken, userName, imgurl) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "그룹 승인 알림",
      body: userName + "에서 그룹 참가를 승인했습니다.",
      data: { imgurl: imgurl }, // 객체 형식으로 변경
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  }

  const sendPushAlarm = async () => {
    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const groupimg = (await GroupimgRef).data().groupimg;
    const groupName = (await GroupimgRef).data().groupName;

    const userMembersRef = firebase
      .firestore()
      .collection("users")
      .doc(props.email)
      .collection("Token")
      .doc("Token")
      .get();

    // 친구가 로그인된 상태일 때. = 토큰이 있을 때만 전송.
    if ((await userMembersRef).exists) {
      const MemberToken = (await userMembersRef).data().token;
      console.log(MemberToken);

      sendPushNotification(MemberToken, groupName, groupimg);
    }
  };

  //승인 -> 그룹원으로 멤버 추가.
  const approveMember = async () => {
    const CreatedAt = new Date().getTime();

    const Memberquery = firebase
      .firestore()
      .collection("users")
      .doc(props.email)
      .get();
    const MemberName = (await Memberquery).data().UserName;
    const Memberimg = (await Memberquery).data().imgurl;

    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const groupimg = (await GroupimgRef).data().groupimg;

    //그룹에 추가
    //그룹 정보 업데이트
    firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("그룹원")
      .doc(props.email)
      .set({
        name: MemberName,
        email: props.email,
        power: "멤버",
        imgurl: Memberimg,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      });

    //사용자 정보 업데이트
    firebase
      .firestore()
      .collection("users")
      .doc(props.email)
      .collection("Group")
      .doc(props.selectedGroup)
      .set({
        groupName: props.selectedGroup,
        groupimg: groupimg,
        created_at: CreatedAt,
        isTogether: false,
      });

    //참가 대기에서 이름 제거.
    firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("참가 대기")
      .doc(props.email)
      .delete();

    //그룹 추가 성공 알림
    firebase
      .firestore()
      .collection("users")
      .doc(props.email)
      .collection("알림")
      .doc(props.selectedGroup + "으로 그룹 추가 알림")
      .set({
        name: props.selectedGroup,
        profileImageUrl: groupimg,
        accept: true,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        match: "그룹 추가 알림",
      });

    sendPushAlarm();
    console.log("참가 완료됐습니다.");
  };

  //미승인 -> 참가 대기에서 이름 제거.
  const rejectMember = async () => {
    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const groupimg = (await GroupimgRef).data().groupimg;

    firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("참가 대기")
      .doc(props.email)
      .delete();

    //그룹 추가 실패 알림
    firebase
      .firestore()
      .collection("users")
      .doc(props.email)
      .collection("알림")
      .doc(props.selectedGroup + "으로 그룹 추가 알림")
      .set({
        name: props.selectedGroup,
        profileImageUrl: groupimg,
        accept: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        match: "그룹 추가 알림",
      });
  };

  //props.component에 따라 텍스트, 스타일, 함수를 다르게 할 수 있음.
  const buttonLabel = props.component === "showmember" ? "내보내기" : "승인";
  const buttonColor =
    props.component === "showmember" ? "rgb(255, 59, 82)" : "rgb(40, 167, 69)";
  const buttondisplay =
    props.component === "showmember" ? "center" : "space-between";
  const buttonAction =
    props.component === "showmember"
      ? () => deleteMember(props.name)
      : () => approveMember();

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 15,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* 그룹원 or 대기 인원들 표시. */}
        <View style={{ flexDirection: "row" }}>
          <Image
            source={{ uri: props.imgurl }}
            style={{
              width: props.profilesSize,
              height: props.profilesSize,
              borderRadius: 50,
              borderColor: "black",
              borderWidth: 1,
            }}
          />
          <View style={{ padding: 5 }}></View>

          <View style={{ justifyContent: "center", marginleft: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 16 }}>
              {props.name}
            </Text>
          </View>
        </View>

        {/* 컴포넌트에 따라 달라지는 버튼. 강퇴(그룹원 관리 탭) or 승인(대기자 관리 탭). */}
        <View style={{ height: 50, justifyContent: buttondisplay }}>
          <TouchableOpacity
            style={{
              backgroundColor: buttonColor,
              borderRadius: 8,
              width: 80,
              height: 30,
              padding: 4,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={buttonAction}
          >
            <Text
              style={{ color: "rgba(255,255,255,0.95)", fontWeight: "600" }}
            >
              {buttonLabel}
            </Text>
          </TouchableOpacity>

          {/* 대기자 관리 탭일 경우 승인 버튼 아래 미승인 버튼을 추가 표시. */}
          {props.component === "waiting" && (
            <TouchableOpacity
              style={{
                marginTop: 4,
                backgroundColor: "rgb(255, 99, 132)",
                borderRadius: 8,
                width: 80,
                height: 30,
                padding: 4,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={rejectMember}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>거절</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      <View style={{ padding: 10 }}></View>
    </View>
  );
};
