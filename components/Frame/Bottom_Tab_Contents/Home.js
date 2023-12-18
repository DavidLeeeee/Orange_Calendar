import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableWithoutFeedback,
  FlatList,
  Animated,
  Dimensions,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import Calendar from "../../Tab_Home/Calendar";
import Addbar from "../../Tab_Home/Addbar";
import Bottom_Contents from "../../Tab_Home/Bottom_Contents";
import { firebase } from "../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";

import GroupCreate from "../GroupCreate";
import GroupEdit from "../GroupEdit";
import GroupJoin from "../GroupJoin";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";

//동기화용

export default function Home() {
  const db = firebase.firestore();
  const currentUser = firebase.auth().currentUser;

  //선택한 캘린더값을 받을 변수
  const [selectedGroup, setSelectedGroup] = useState("My Calendar");
  const [groups, setGroups] = useState([]);

  //Drawer Madal 관리
  const [DrawerModal, setDrawerModal] = useState(false);
  const modalAnimation = useRef(
    new Animated.Value(-Dimensions.get("window").width * 0.4)
  ).current;

  const openModal = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setDrawerModal(true);
  };

  const closeModal = () => {
    Animated.timing(modalAnimation, {
      toValue: -Dimensions.get("window").width * 0.4,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setDrawerModal(false);
    });
  };

  // ExpoPushToken 발급 받기.
  async function getExpoPushToken() {
    let token;

    if (Device.isDevice) { // 사용자의 디바이스가 실제 기기인지 확인.
      // 사용자가 푸시 알림을 허용했는지 확인하기 위해 알림 권한을 요청하고, 권한 상태를 확인.
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }

      // 토큰 발급.
      token = await Notifications.getExpoPushTokenAsync({
        projectId: "ac7f76b4-ac7d-4be0-8ac8-007f82ab2be2", // Expo의 프로젝트 ID.
      });
    } else {
      alert("Must use physical device for Push Notifications");
    }

    // Android 기기의 경우, 알림 채널을 설정.
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token.data;
  }

  // Firestore에 발급 받은 토큰 등록.
  async function registerTokentoFirebase(token) {
    db.collection("users")
      .doc(firebase.auth().currentUser.email)
      .collection("Token")
      .doc("Token")
      .set({
        token: token,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
      })
      .catch((error) => {
        console.error("Error writing document: ", error);
      });
  }

  // 사용자가 로그인하여 컴포넌트가 렌더링되면 토큰을 발급.
  useEffect(() => {
    getExpoPushToken().then((token) => {
      registerTokentoFirebase(token);
    });
  }, [currentUser]);

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  useEffect(() => {
    let unsubscriberAuth = null;
    let subscriber = null;

    unsubscriberAuth = firebase.auth().onAuthStateChanged((user) => {
      if (subscriber) {
        subscriber(); // 이전 구독 해제
      }

      if (user) {
        // 로그인한 사용자만 데이터 가져오기
        subscriber = db
          .collection("users")
          .doc(user.email)
          .collection("Group")
          .onSnapshot((querySnapshot) => {
            const groupsArray = [];

            querySnapshot.forEach((documentSnapshot) => {
              groupsArray.push({
                ...documentSnapshot.data(),
                key: documentSnapshot.id,
              });
            });

            groupsArray.sort((a, b) => {
              if (a.created_at < b.created_at) return -1;
              if (a.created_at > b.created_at) return 1;
              return 0;
            });

            // Add 'My Calendar' to the beginning of the sorted array
            groupsArray.unshift({ key: "My Calendar" });

            setGroups(groupsArray);
          });
      } else {
        setGroups([{ key: "My Calendar" }]);
        setSelectedGroup("My Calendar");
      }
    });

    return () => {
      if (unsubscriberAuth) {
        unsubscriberAuth(); // Auth 리스너 해제1
      }
      if (subscriber) {
        subscriber(); // Firestore 구독 해제
      }
    };
  }, []);

  // 그룹 생성 모달 상태와 함수 추가
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const openCreateModal = () => {
    setIsCreateModalVisible(true);
  };
  const closeCreateModal = () => {
    setIsCreateModalVisible(false);
  };
  const openJoinModal = () => {
    setIsJoinModalVisible(true);
  };
  const closeJoinModal = () => {
    setIsJoinModalVisible(false);
  };
  const openEditModal = () => {
    setIsEditModalVisible(true);
  };
  const closeEditModal = () => {
    setIsEditModalVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* ScrollView 부분 */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            marginTop:
              Platform.OS === "android" ? 74 : styles.customHeader.height,
          }}
        ></View>
        <Calendar selectedGroup={selectedGroup} />
        <Addbar selectedGroup={selectedGroup} />
        <Bottom_Contents selectedGroup={selectedGroup} />
      </ScrollView>

      {/* Header 부분 - 오버레이 */}
      <View
        style={{
          ...styles.customHeader,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          position: "absolute", // 오버레이를 위해 위치를 절대값으로 설정
          top: 0, // 상단에 고정
          left: 0, // 왼쪽에 고정
          right: 0, // 오른쪽에 고정
          zIndex: 1, // 다른 요소 위에 오버레이되도록 zIndex 설정.
          height: Platform.OS === "android" ? 74 : styles.customHeader.height, // 안드로이드일 경우 높이를 54로 설정
          ...(signatureStyles ? signatureStyles.header : {}),
        }}
      >
        <TouchableOpacity style={styles.buttonStyle} onPress={openModal}>
          <Icon
            name="dehaze"
            size={30}
            style={[signatureStyles ? signatureStyles.Textcolor : {}]}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.SelectedCalendar_TextStyle,
            signatureStyles ? signatureStyles.Textcolor : {},
          ]}
        >
          {selectedGroup}
        </Text>
        <Icon
          style={styles.buttonStyle}
          name="info-outline"
          size={20}
          color="rgba(100, 100, 100, 1)"
        />
        {/* 기타 헤더 요소들 */}
      </View>

      {/* My Calendar, 그룹 캘린더, 그룹 생성편집참가 탭을 다루는 메인 Modal. */}
      {DrawerModal && (
        <Modal animationType="none" transparent={true} visible={DrawerModal}>
          <TouchableWithoutFeedback onPress={closeModal}>
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContent,
                  { left: modalAnimation },
                  signatureStyles ? signatureStyles.drawer : {},
                ]}
              >
                {/* 소속된 그룹들 표시. */}
                <FlatList
                  style={[
                    styles.flatListStyle,
                    Platform.OS === "android" ? { top: 0 } : {},
                  ]}
                  data={groups}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ padding: 10 }}
                      onPress={() => {
                        setSelectedGroup(item.key);
                        closeModal();
                      }}
                    >
                      {/* 현재 항목이 선택된 항목과 동일한지 확인. */}
                      <Text
                        style={[
                          {
                            fontSize: 14,
                            fontWeight:
                              item.key === selectedGroup ? "800" : "normal",
                          },
                          signatureStyles ? signatureStyles.Textcolor : {},
                        ]}
                      >
                        {item.key}
                      </Text>
                    </TouchableOpacity>
                  )}
                />

                {/* 그룹 생성, 편집, 참가 모달 버튼. */}
                <View
                  style={{ height: "25%", justifyContent: "space-between" }}
                >
                  <TouchableOpacity
                    style={{
                      width: "100%",
                      height: "33%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={openCreateModal}
                  >
                    <Text
                      style={[
                        { fontSize: 16 },
                        signatureStyles ? signatureStyles.Textcolor : {},
                      ]}
                    >
                      그룹 생성
                    </Text>
                  </TouchableOpacity>

                  {/* isVisible, onClose를 props로 보낸다. 이를 통해 컴포넌트로 분리해서도 모달처럼 상호작용할 수 있음. */}
                  <GroupCreate
                    isVisible={isCreateModalVisible}
                    onClose={closeCreateModal}
                  />

                  <TouchableOpacity
                    style={{
                      width: "100%",
                      height: "33%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={openEditModal}
                  >
                    <Text
                      style={[
                        { fontSize: 16 },
                        signatureStyles ? signatureStyles.Textcolor : {},
                      ]}
                    >
                      그룹 편집
                    </Text>
                  </TouchableOpacity>

                  <GroupEdit
                    isVisible={isEditModalVisible}
                    onClose={closeEditModal}
                  />

                  <TouchableOpacity
                    style={{
                      width: "100%",
                      height: "33%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={openJoinModal}
                  >
                    <Text
                      style={[
                        { fontSize: 16 },
                        signatureStyles ? signatureStyles.Textcolor : {},
                      ]}
                    >
                      그룹 참가
                    </Text>
                  </TouchableOpacity>

                  <GroupJoin
                    isVisible={isJoinModalVisible}
                    onClose={closeJoinModal}
                  />
                </View>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  //드로워 관련
  customHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 84,
    backgroundColor: "rgba(255,255,255,1)",
  },
  buttonStyle: {
    height: 48,
    alignItems: "center",
    padding: 10,
    //backgroundColor: "#eee",
  },
  SelectedCalendar_TextStyle: {
    height: 48,
    fontSize: 18,
    padding: 10,
    textAlign: "center",
    alignItems: "center",
    borderRadius: 5,
    //backgroundColor: "#eee",
  },
  modalOverlay: {
    position: "absolute", // 위치를 절대값으로 설정
    top: 0, // 상단에서 0만큼 떨어진 위치에 배치
    left: 0, // 좌측에서 0만큼 떨어진 위치에 배치
    width: "100%", // 넓이를 100%로 설정하여 전체 화면을 차지하도록 함
    height: "100%", // 높이도 100%로 설정하여 전체 화면을 차지하도록 함
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    justifyContent: "center",
    width: Dimensions.get("window").width * 0.4,
    height: "100%",
    backgroundColor: "red", //여기에 적용하기
  },
  flatListStyle: {
    top: 30,
    padding: 10,
  },
  arrow: {
    fontSize: 24,
    marginHorizontal: 10,
  },
  //모달 창
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
    width: "90%",
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

    justifyContent: "space-between",
  },
  //모달 창 안에 표시될 일정 텍스트 스타일
  modalcontentText: {
    fontSize: 16,
    padding: 2,
    borderRadius: 5,
    marginTop: 1,
    overflow: "hidden",
  },
  //modal창 안에 일정 텍스트 프레임
  modalcontentelement: {
    // backgroundColor: 'red',
    width: "100%",

    justifyContent: "space-between",
    flexDirection: "row",
  },
});
