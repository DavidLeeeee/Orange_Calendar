import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Modal,
} from "react-native";
import AlarmTab from "../../Tab_Alarm/AlarmTab";
import { firebase } from "../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";
import { selectSignatureStyles } from "../../Redux/selector";
import { useSelector } from "react-redux";
const screenWidth = Dimensions.get("window").width;

export default function Alarm() {
  const db = firebase.firestore();
  const [alarmdata, setAlarmdata] = useState([]);
  const [loadingmodal, setLoadingmodal] = useState(false);

  // 알림 종류를 판별하기 위한 비교용 변수들.
  const isfriendword = "친구 추가 알림";
  // 친구 수락, 거절 알림. 수락시 푸시 알림.
  const isfriendaccept = "친구 알림";

  const isGroupappliedword = "그룹 추가 알림";
  const isGroupapplyword = "그룹 신청 알림";
  const isGroupjoinword = "그룹 참가 알림";
  // 강퇴시 force를 true로 부여해서 문구 표시.
  const isGroupoutword = "그룹 탈퇴 알림";

  const isScheduleword = "일정 알림";
  const isfriendTouch = "콕 찌르기 알림";
  const isFirstLogin = "가입 축하 알림";

  const isInform = "공지 알림";

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  //사용자의 알림 가져오기.
  const getAlarm = async () => {
    const userId = firebase.auth().currentUser;

    const unsubscribe = db
      .collection("users")
      .doc(userId.email)
      .collection("알림")
      .orderBy("timestamp", "desc")
      .onSnapshot(
        (querySnapshot) => {
          const alarms = [];
          querySnapshot.forEach((doc) => {
            alarms.push({ id: doc.id, ...doc.data() });
          });

          // alarms 배열에 모든 알림 문서가 저장됨.
          setAlarmdata(alarms);
          setLoadingmodal(false); // 데이터 로딩 종료
        },
        (error) => {
          // 에러 핸들링
          console.error("알림 데이터 가져오기 실패:", error);
          setLoadingmodal(false);
        }
      );

    return unsubscribe;
  };

  async function sendPushNotification(expoPushToken, userName, imgurl) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "친구 수락 알림",
      body: userName + "님이 친구를 수락하셨습니다.",
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

  const sendPushAlarm = async (props) => {
    const user = firebase.auth().currentUser;

    const userRef = firebase
      .firestore()
      .collection("users")
      .doc(user.email)
      .get();

    const currentUserName = (await userRef).data().UserName;
    const currentUserImageUrl = (await userRef).data().imgurl;

    const userFriendsRef = firebase
      .firestore()
      .collection("users")
      .doc(props.email)
      .collection("Token")
      .doc("Token")
      .get();

    // 친구가 로그인된 상태일 때. = 토큰이 있을 때만 전송.
    if ((await userFriendsRef).exists) {
      const friendToken = (await userFriendsRef).data().token;
      console.log(friendToken);

      sendPushNotification(friendToken, currentUserName, currentUserImageUrl);
    }
  };

  // 친구 추가 수락 + 알람에서 삭제되면서 추가되었다는 알람을 그 사람에게 보내야함.
  const acceptfriend = async (props) => {
    const userId = firebase.auth().currentUser;

    try {
      const userFriendsRef = db
        .collection("users")
        .doc(userId.email)
        .collection("friends")
        .doc(props.email);

      await userFriendsRef.set({
        name: props.name,
        email: props.email,
        profileImageUrl: props.imgurl,
      });

      //알림에 필요한 데이터인 사용자의 이름, 이미지.
      const userRef = db.collection("users").doc(userId.email).get();
      const currentUserName = (await userRef).data().UserName;
      const currentUserImageUrl = (await userRef).data().imgurl;

      //친구 신청한 사람의 데이터에 내 정보 저장.
      const FriendRef = db
        .collection("users")
        .doc(props.email)
        .collection("friends")
        .doc(userId.email);

      await FriendRef.set({
        name: currentUserName,
        email: userId.email,
        profileImageUrl: currentUserImageUrl,
      });

      //친구에게 수락했다는 알림 보내기.
      db.collection("users")
        .doc(props.email)
        .collection("알림")
        .doc(currentUserName + "친구 알림")
        .set({
          name: currentUserName,
          profileImageUrl: currentUserImageUrl,
          accept: true,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          match: "친구 알림",
        });

      sendPushAlarm(props);
    } catch (error) {
      console.log("Error adding friend: ", error);
    }

    // 친구 수락 후 알림에서 제거.
    db.collection("users")
      .doc(userId.email)
      .collection("알림")
      .doc(props.name + "님의 친구 추가 알림")
      .delete();

    setAlarmdata((prevData) => prevData.filter((item) => item.id !== props.id));
  };

  // 친구 거절, 그 외 삭제
  const deleteAlarm = async (props) => {
    const userId = firebase.auth().currentUser;

    const userRef = db.collection("users").doc(userId.email).get();
    const currentUserName = (await userRef).data().UserName;
    const currentUserImageUrl = (await userRef).data().imgurl;

    console.log(props.name, props.match);

    //친구 거절 + 삭제.
    if (props.match === isfriendword) {
      db.collection("users")
        .doc(props.email)
        .collection("알림")
        .doc(currentUserName + "친구 알림")
        .set({
          name: currentUserName,
          profileImageUrl: currentUserImageUrl,
          accept: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          match: "친구 알림",
        });

      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "님의 친구 추가 알림")
        .delete();
      //이 아래로는 그 외 삭제.
    } else if (props.match === isGroupappliedword) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "으로 그룹 추가 알림")
        .delete();
    } else if (props.match === isGroupapplyword) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "으로 그룹 신청 알림")
        .delete();
    } else if (props.match === isGroupjoinword) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "으로 그룹 참가 알림")
        .delete();
    } else if (props.match === isScheduleword) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.writer + "님의 일정 알림_" + props.schedule)
        .delete();
    } else if (props.match === isfriendaccept) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "친구 알림")
        .delete();
    } else if (props.match === isGroupoutword) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "에서 그룹 탈퇴 알림")
        .delete();
    } else if (props.match === isfriendTouch) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(props.name + "님의 콕 찌르기 알림")
        .delete();
    } else if (props.match === isFirstLogin) {
      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc("가입 축하 알림")
        .delete();
    } else if (props.match === isInform) {
      const firstFourLetters = props.schedule.substring(0, 4);

      db.collection("users")
        .doc(userId.email)
        .collection("알림")
        .doc(firstFourLetters + "공지 알림")
        .delete();
    }

    setAlarmdata((prevData) => prevData.filter((item) => item.id !== props.id));
  };

  //모든 알림 지우기
  const deleteAllAlarms = async () => {
    const userId = firebase.auth().currentUser;

    const deleteRef = db
      .collection("users")
      .doc(userId.email)
      .collection("알림");

    const querySnapshot = await deleteRef.get();

    // 알림을 실제로 삭제하기 전에 어떤 알림을 유지할지 판별할 임시 배열
    let remainingAlarms = [];

    // 각 문서에 대해
    querySnapshot.forEach(async (doc) => {
      const alarmData = doc.data();

      // 친구 추가 알림인 경우, 임시 배열에 추가
      if (alarmData.match === "친구 추가 알림") {
        remainingAlarms.push(alarmData);
      } else {
        await doc.ref.delete();
      }
    });

    // state 업데이트
    setAlarmdata(remainingAlarms);
  };

  useEffect(() => {
    const handleAuthStateChanged = (user) => {
      if (user) {
        getAlarm();
      } else {
        setAlarmdata([]);
      }
    };

    const unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuthStateChanged);

    return () => unsubscribe();
  }, []);

  //수락, 거절, 삭제는 동기화가 바로 될 수 있게 하기 위해 Alarm.js에서 처리.
  const ButtonComponent = (props) => {
    //친구 추가 알림이면 수락/거절
    if (props.match === isfriendword) {
      // Use data from alarmdata to customize the UI
      return (
        <View style={{ justifyContent: "center", alignItems: "center" }}>
          <TouchableOpacity
            style={{
              marginRight: 5,
              justifyContent: "center",
              borderRadius: 7,
              backgroundColor: "rgb(0, 123, 255)",
              padding: 7,
              paddingVertical: 9,
            }}
            onPress={() => {
              acceptfriend(props);
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>수락</Text>
          </TouchableOpacity>

          <View style={{ padding: 5 }}></View>

          <TouchableOpacity
            style={{
              marginRight: 5,
              justifyContent: "center",
              borderRadius: 7,
              backgroundColor: "rgb(255,99,132)",
              padding: 7,
              paddingVertical: 9,
            }}
            onPress={() => {
              deleteAlarm(props);
            }}
          >
            <Text style={{ color: "black", fontWeight: "600" }}>거절</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      //다른 종류의 알림 모두 상호작용 필요 없음.
      return (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}
        >
          <TouchableOpacity
            style={{ justifyContent: "center" }}
            onPress={() => {
              deleteAlarm(props);
            }}
          >
            <Icon name="close" size={25}></Icon>
          </TouchableOpacity>
        </View>
      );
    }
  };
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "space-around",
        backgroundColor: "white",
      }}
    >
      {/* 로딩 창. */}
      <Modal transparent={true} visible={loadingmodal}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      </Modal>

      {/* 알림 개수, 알림 모두 지우기 버튼 */}
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 10,
          paddingHorizontal: 24,
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          ...(signatureStyles ? signatureStyles.content : {}),
        }}
      >
        <Text style={{ ...(signatureStyles ? signatureStyles.Textcolor : {}) }}>
          알림 {alarmdata.length}개
        </Text>
        <TouchableOpacity onPress={deleteAllAlarms}>
          <Text
            style={{
              ...(signatureStyles ? signatureStyles.Textcolor : {}),
            }}
          >
            알림 지우기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 데이터 표시 부분 */}
      <ScrollView
        style={{
          backgroundColor: "red",
          width: "100%",
          paddingTop: 10,
          ...(signatureStyles ? signatureStyles.background : {}),
        }}
        contentContainerStyle={{ alignItems: "center" }}
      >
        {alarmdata.map((item, index) => (
          <View key={index}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                width: screenWidth - 15,
                padding: 10,
                borderRadius: 5,
                borderWidth: 1,
                borderColor: "grey",
                backgroundColor: "white",
              }}
            >
              {/* 데이터를 표시해주는 AlarmTab */}
              <AlarmTab
                // 분류
                id={item.id}
                // 공통 (친구 이름-사진, 그룹 이름-사진)
                name={item.name}
                imgurl={item.profileImageUrl}
                // 친구 이메일 (상호작용)
                email={item.email}
                // 일정 작성자, 내용, 날짜
                writer={item.writer}
                schedule={item.schedule}
                date={item.date}
                match={item.match}
                accept={item.accept}
                force={item.force}
              />

              {/* 데이터 옆에 표시될 버튼 */}
              <ButtonComponent
                // 분류
                id={item.id}
                // 공통 (친구 이름-사진, 그룹 이름-사진)
                name={item.name}
                imgurl={item.profileImageUrl}
                // 친구 이메일 (상호작용)
                email={item.email}
                // 일정 작성자, 내용, 날짜
                writer={item.writer}
                schedule={item.schedule}
                date={item.date}
                match={item.match}
                force={item.force}
              />
            </View>

            <View style={{ padding: 5 }}></View>
          </View>
        ))}

        <View style={{ padding: 20 }}></View>
      </ScrollView>
    </View>
  );
}
