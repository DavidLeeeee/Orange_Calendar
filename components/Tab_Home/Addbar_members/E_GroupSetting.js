import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Groupmember from "./Group_Setting_Function/Group_Show_Members";
import Grouppower from "./Group_Setting_Function/Group_Authority";
import GroupImage from "./Group_Setting_Function/Group_Image";
import Groupwaiting from "./Group_Setting_Function/Group_Waiting";
import { firebase } from "../../../../Afirebaseconfig";
import { CheckBox } from "react-native-elements";
import { ScrollView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

export default function GroupSetting(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [groupcode, setGroupcode] = useState("");
  //참가 방식 데이터, 그룹 설정 창에서 실시간으로 변경된다.
  const [approvaldata, setApprovaldata] = useState("");
  const [isWaiting, setIsWaiting] = useState("");
  const [rangedata, setRangedata] = useState("");
  const [passwordis, setPasswordis] = useState(false);
  const [passwordvalue, setPasswordvalue] = useState("");
  const [waitingMember, setWaitingMember] = useState([]);
  const [waitingMembersize, setWaitingMembersize] = useState(0);

  const db = firebase.firestore();

  //저장버튼 클릭 유도를 위한 상태와 함수
  const [isChanged, setIsChanged] = useState(false);
  const [isAutoChanged, setIsAutoChanged] = useState(false);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  // 변경 감지를 위한 함수
  const handleSettingChange = (isAuto) => {
    setIsChanged(true);
    if (isAuto === "자동 참가") {
      setIsAutoChanged(true);
    } else if (isAuto === "참가 대기") {
      setIsAutoChanged(false);
    }
  };

  // 저장 버튼의 스타일을 동적으로 변경
  const saveButtonStyle = isChanged
    ? styles.saveButtonHighlighted
    : styles.saveButton;

  //그룹 코드 불러오기.
  useEffect(() => {
    getGroupCode();
  }, [props.selectedGroup]); //선택된 그룹이 바뀔 때마다 useEffect 호출.

  const getGroupCode = async () => {
    try {
      const doc = await firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .get();

      if (doc.exists) {
        const groupcode = doc.data().groupcode;
        setGroupcode(groupcode);
      } else {
        console.log("Group calendar does not exist");
      }
    } catch (error) {
      console.error("Error getting group code:", error);
    }
  };

  //참가 방식 가져오기.
  const getGroupInfo = async () => {
    const docRef = await db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const newapprovaldata = docRef.data().groupJoin;
    const newrangedata = docRef.data().groupRange;
    const passwordis = docRef.data().passwordEnabled;
    const passwordvalue = docRef.data().passwordValue;
    setApprovaldata(newapprovaldata);
    setIsWaiting(newapprovaldata);
    setRangedata(newrangedata);
    setPasswordis(passwordis);
    setPasswordvalue(passwordvalue);

    console.log("Setting in method", approvaldata); //함수 안에서는 전역 변수로 옮겨도 console로 바로 찍히지 않는다.
  };
  // console.log("Setting out of method", approvaldata); //함수 바깥에선 적용된다.

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

  const sendPushAlarm = async (memberEmail) => {
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
      .doc(memberEmail)
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

  const getWaitingMembercount = async () => {
    const groupRef = db.collection("Group calendar").doc(props.selectedGroup);

    const unsubscribe = groupRef.collection("참가 대기").onSnapshot(
      (snapshot) => {
        const waitingMember = [];
        snapshot.forEach((doc) => {
          waitingMember.push({ id: doc.id, ...doc.data() });
        });

        setWaitingMembersize(snapshot.size);
        setWaitingMember(waitingMember);
      },
      (error) => {
        console.error("Error fetching waiting members: ", error);
      }
    );

    return unsubscribe;
  };

  const acceptAll = async () => {
    // 참가 대기 컬렉션에 대한 참조를 가져옵니다.
    const waitingMembersRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("참가 대기");

    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const groupimg = (await GroupimgRef).data().groupimg;

    try {
      // 참가 대기 컬렉션에서 모든 문서를 가져옵니다.
      const snapshot = await waitingMembersRef.get();

      // Firestore의 batch를 사용하여 여러 작업을 한 번에 처리합니다.
      const batch = firebase.firestore().batch();

      // 모든 참가 대기 문서에 대하여 반복합니다.
      for (const doc of snapshot.docs) {
        const memberEmail = doc.id; // 문서 ID는 멤버의 이메일입니다.
        const memberData = doc.data();

        // 그룹원 컬렉션에 추가될 문서 참조
        const memberRef = firebase
          .firestore()
          .collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("그룹원")
          .doc(memberEmail);

        // 사용자의 그룹 컬렉션에 추가될 문서 참조
        const userGroupRef = firebase
          .firestore()
          .collection("users")
          .doc(memberEmail)
          .collection("Group")
          .doc(props.selectedGroup);

        // 알림 컬렉션에 추가될 문서 참조
        const notificationRef = firebase
          .firestore()
          .collection("users")
          .doc(memberEmail)
          .collection("알림")
          .doc(props.selectedGroup + "으로 그룹 추가 알림");

        // 그룹원 정보 설정
        batch.set(memberRef, {
          name: memberData.name,
          email: memberEmail,
          power: "멤버",
          imgurl: memberData.imgurl,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // 사용자의 그룹 정보 설정
        batch.set(userGroupRef, {
          groupName: props.selectedGroup,
          groupimg: groupimg,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
        });

        // 참가 대기 목록에서 제거
        batch.delete(waitingMembersRef.doc(memberEmail));

        // 알림 설정
        batch.set(notificationRef, {
          name: props.selectedGroup,
          profileImageUrl: groupimg,
          accept: true,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          match: "그룹 추가 알림",
        });

        sendPushAlarm(memberEmail);
      }

      // batch.commit()을 호출하여 모든 변경사항을 적용합니다.
      await batch.commit();
      console.log("모든 참가자가 그룹원으로 승인되었습니다.");

      db.collection("Group calendar")
        .doc(props.selectedGroup)
        .update({
          groupJoin: approvaldata,
          groupRange: rangedata,
          passwordEnabled: passwordis,
          passwordValue: passwordis ? passwordvalue : null,
        });

      setModalVisible(!modalVisible);
      setIsChanged(false);
    } catch (error) {
      console.error("모든 참가자를 승인하는 데 실패했습니다:", error);
      throw error;
    }
  };

  const rejectAll = async () => {
    // 참가 대기 컬렉션에 대한 참조를 가져옵니다.
    const waitingMembersRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("참가 대기");

    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();

    const groupimg = (await GroupimgRef).data().groupimg;

    try {
      // 참가 대기 컬렉션에서 모든 문서를 가져옵니다.
      const snapshot = await waitingMembersRef.get();

      // Firestore의 batch를 사용하여 여러 작업을 한 번에 처리합니다.
      const batch = firebase.firestore().batch();

      // 모든 참가 대기 문서에 대하여 반복합니다.
      snapshot.docs.forEach((doc) => {
        // 참가 대기 문서에 대한 참조
        const docRef = waitingMembersRef.doc(doc.id);
        const memberEmail = doc.id;
        // 참가 대기 목록에서 해당 문서를 삭제합니다.
        batch.delete(docRef);

        const notificationRef = firebase
          .firestore()
          .collection("users")
          .doc(memberEmail)
          .collection("알림")
          .doc(props.selectedGroup + "으로 그룹 추가 알림");

        batch.set(notificationRef, {
          name: props.selectedGroup,
          profileImageUrl: groupimg,
          accept: false,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          match: "그룹 추가 알림",
        });
      });

      // batch.commit()을 호출하여 모든 삭제 작업을 적용합니다.
      await batch.commit();
      console.log("모든 참가 대기자가 거부되었습니다.");

      db.collection("Group calendar")
        .doc(props.selectedGroup)
        .update({
          groupJoin: approvaldata,
          groupRange: rangedata,
          passwordEnabled: passwordis,
          passwordValue: passwordis ? passwordvalue : null,
        });

      setModalVisible(!modalVisible);
      setIsChanged(false);
    } catch (error) {
      console.error("모든 참가 대기자를 거부하는 데 실패했습니다:", error);
      throw error;
    }
  };

  const togglePasswordInput = () => {
    setPasswordis(!passwordis);
  };

  const handlePasswordChange = (text) => {
    setPasswordvalue(text);
  };

  const saveSetting = () => {
    // 자동 참가가 눌렸는지 확인.
    console.log(isAutoChanged);
    if (isAutoChanged === true) {
      // 대기자가 있는지 확인
      if (waitingMembersize !== 0) {
        Alert.alert(
          "대기자 알림",
          "대기자가 존재합니다. 어떻게 하시겠습니까? (승인 시 모두 승인, 미승인 시 모두 미승인합니다.)",
          [
            {
              text: "취소",
              style: "cancel",
            },
            {
              text: "승인",
              onPress: async () => {
                acceptAll();
              },
            },
            {
              text: "미승인",
              onPress: async () => {
                rejectAll();
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        db.collection("Group calendar")
          .doc(props.selectedGroup)
          .update({
            groupJoin: approvaldata,
            groupRange: rangedata,
            passwordEnabled: passwordis,
            passwordValue: passwordis ? passwordvalue : null,
          });

        setModalVisible(!modalVisible);
        setIsChanged(false);
      }
    } else {
      db.collection("Group calendar")
        .doc(props.selectedGroup)
        .update({
          groupJoin: approvaldata,
          groupRange: rangedata,
          passwordEnabled: passwordis,
          passwordValue: passwordis ? passwordvalue : null,
        });

      setModalVisible(!modalVisible);
      setIsChanged(false);
    }
  };

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* 최상단 바 */}
            <View
              style={{
                marginLeft: 5,
                paddingBottom: 10,
                marginBottom: 1,
                flexDirection: "row",
                alignItems: "center",
                borderColor: "#e0e0e0",
                borderBottomWidth: 0.5,
                // iOS 그림자 스타일
                shadowColor: "#000",
              }}
            >
              <TouchableOpacity
                style={{ alignItems: "flex-end" }}
                onPress={() => {
                  if (isChanged) {
                    Alert.alert(
                      "변경 사항 저장",
                      "변경 사항을 저장하지 않고 나가시겠습니까?",
                      [
                        {
                          text: "돌아가기",
                          onPress: () => console.log("돌아가기"),
                          style: "cancel",
                        },
                        {
                          text: "나가기",
                          onPress: () => {
                            setModalVisible(!modalVisible);
                            setIsChanged(false);
                          },
                          style: "destructive",
                        },
                      ],
                      { cancelable: false }
                    );
                  } else {
                    setModalVisible(!modalVisible);
                  }
                }}
              >
                <Icon name="arrow-back" size={25}></Icon>
              </TouchableOpacity>

              <Text
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontWeight: "400",
                  fontSize: 18,
                }}
              >
                그룹 설정
              </Text>
              <View style={{ width: 30 }}></View>
            </View>

            <View style={{ alignItems: "center", height: "93%" }}>
              <ScrollView showsVerticalScrollIndicator={false} style={{}}>
                <View style={{ alignItems: "center" }}>
                  {/* 그룹 이미지 */}
                  <GroupImage selectedGroup={props.selectedGroup} />
                  <View style={{ padding: 5 }}></View>
                  <Text>그룹 코드: {groupcode}</Text>

                  <View style={{ padding: 10 }}></View>
                  {/* 그룹원 관리 탭 */}
                  <Groupmember selectedGroup={props.selectedGroup} />
                  <View style={{ padding: 5 }}></View>

                  {/* 권한 설정 탭 */}
                  <Grouppower selectedGroup={props.selectedGroup} />

                  {/* 참가 방식이 참가 대기일 경우에만 대기자 관리 탭을 화면에 표시. */}
                  {isWaiting === "참가 대기" && (
                    <View style={{ marginTop: 10, marginBottom: 10 }}>
                      <Groupwaiting selectedGroup={props.selectedGroup} />
                    </View>
                  )}
                  <View style={{ padding: 10 }}></View>
                  {/* 참가 방식 변경 가능. 실시간 반영 확인. */}
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderBottomWidth: 0.5,
                      borderTopWidth: 0.5,
                      borderColor: "rgb(200,200,200)",
                    }}
                  >
                    <CheckBox
                      title="자동 참가"
                      checkedIcon="dot-circle-o"
                      uncheckedIcon="circle-o"
                      checked={approvaldata === "자동 참가"}
                      onPress={() => {
                        setApprovaldata("자동 참가");
                        handleSettingChange("자동 참가");
                      }}
                      size={24} // 크기 조절
                      containerStyle={{
                        width: 110,
                        height: 44,
                        backgroundColor: "transparent",
                        borderWidth: 0, // 테두리 없앰
                      }}
                    />
                    <CheckBox
                      title="참가 대기"
                      checkedIcon="dot-circle-o"
                      uncheckedIcon="circle-o"
                      checked={approvaldata === "참가 대기"}
                      onPress={() => {
                        setApprovaldata("참가 대기");
                        handleSettingChange("참가 대기");
                      }}
                      size={24} // 크기 조절
                      containerStyle={{
                        width: 110,
                        height: 44,
                        backgroundColor: "transparent",
                        borderWidth: 0, // 테두리 없앰
                      }}
                    />
                  </View>

                  {/* 공개 범위 변경.*/}
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      justifyContent: "center",
                      borderBottomWidth: 0.5,
                      borderColor: "rgb(200,200,200)",
                      marginBottom: 10,
                    }}
                  >
                    <CheckBox
                      title="전체 공개"
                      checkedIcon="dot-circle-o"
                      uncheckedIcon="circle-o"
                      checked={rangedata === "전체 공개"}
                      onPress={() => {
                        setRangedata("전체 공개");
                        handleSettingChange("");
                      }}
                      size={24} // 크기 조절
                      containerStyle={{
                        width: 110,
                        height: 44,
                        backgroundColor: "transparent",
                        borderWidth: 0, // 테두리 없앰
                      }}
                    />
                    <CheckBox
                      title="비공개"
                      checkedIcon="dot-circle-o"
                      uncheckedIcon="circle-o"
                      checked={rangedata === "비공개"}
                      onPress={() => {
                        setRangedata("비공개");
                        handleSettingChange("");
                      }}
                      size={24} // 크기 조절
                      containerStyle={{
                        width: 110,
                        height: 44,
                        backgroundColor: "transparent",
                        borderWidth: 0, // 테두리 없앰
                      }}
                    />
                  </View>

                  <View style={{ padding: 5 }}></View>

                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      justifyContent: "center",
                      marginBottom: 30,
                    }}
                  >
                    <TouchableOpacity
                      style={
                        passwordis
                          ? styles.toggleButtonActive
                          : styles.toggleButtonInactive
                      }
                      onPress={() => {
                        togglePasswordInput();
                        handleSettingChange();
                      }}
                    >
                      <Text>비밀번호 설정</Text>
                    </TouchableOpacity>

                    {passwordis ? (
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="비밀번호를 입력해주세요."
                        placeholderTextColor={"rgba(0,0,0,0.2)"}
                        value={passwordvalue}
                        onChangeText={handlePasswordChange}
                        //secureTextEntry
                      />
                    ) : (
                      <View style={styles.inactivePasswordBox}>
                        <Text style={{ color: "#B0B0B0" }}>
                          비밀번호 비활성화
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </ScrollView>
              <TouchableOpacity
                style={saveButtonStyle}
                onPress={() => {
                  saveSetting();
                }}
              >
                <Text style={{ color: "white", fontSize: 15 }}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        //   style={[styles.button, styles.buttonClose]}
        onPress={() => {
          setModalVisible(true);
          getGroupInfo(); //그룹 설정 아이콘을 누르면, firestore에서 참가 방식 데이터 호출.
          getWaitingMembercount();
        }}
      >
        <Icon
          name="settings"
          size={25}
          style={[signatureStyles ? signatureStyles.Textcolor : {}]}
        ></Icon>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    padding: 12,
    backgroundColor: "skyblue",
    flexDirection: "row",
    justifyContent: "space-between",

    borderRadius: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: 320,
    height: 500,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
  },
  saveButton: {
    top: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    width: 240,
    height: 28,
    backgroundColor: "rgba(0,123,255, 1)",
    borderRadius: 8,
  },
  saveButtonHighlighted: {
    top: 5,
    marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    width: 240,
    height: 28,

    backgroundColor: "rgba(0,156,255, 1)", // 밝은 파란색
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  closeButton: {
    position: "absolute",
    top: "103%",
    right: -15,
  },
  toggleButtonInactive: {
    width: "35%",
    height: 40,
    borderColor: "#B0B0B0", // 짙은 회색
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleButtonActive: {
    width: "35%",
    height: 40,
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "rgb(250,250,250)",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    elevation: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  passwordInput: {
    height: 40,
    marginLeft: 10,
    flex: 1,
    padding: 10,
    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 5,
  },
  inactivePasswordBox: {
    height: 40,
    marginLeft: 10,
    borderColor: "#B0B0B0",
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
