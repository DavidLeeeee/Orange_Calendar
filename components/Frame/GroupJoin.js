import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Button,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from "react-native";
import { firebase } from "../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";

//0930 searchGroups에서 그룹 추가 부분을 addGroup으로 분리.

export default function GroupJoin({ isVisible, onClose }) {
  // 그룹 찾기 관련
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const currentUser = firebase.auth().currentUser;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  //그룹 search 후 목록에 표시.
  const searchGroups = async () => {
    try {
      const user = firebase.auth().currentUser;

      // 현재 사용자가 속해 있는 그룹 목록 가져오기
      const userRef = firebase.firestore().collection("users").doc(user.email);
      const userGroupsSnapshot = await userRef.collection("Group").get();
      const userGroups = userGroupsSnapshot.docs.map((doc) => doc.id);

      let querySnapshot;

      // selectedButton 상태에 따라 다른 필드로 쿼리를 수행
      if (selectedButton === 1) {
        // '코드' 선택 시
        querySnapshot = await firebase
          .firestore()
          .collection("Group calendar")
          .where("groupcode", ">=", searchQuery)
          .where("groupcode", "<=", searchQuery + "\uf8ff")
          .get();
      } else if (selectedButton === 2) {
        // '이름' 선택 시
        querySnapshot = await firebase
          .firestore()
          .collection("Group calendar")
          .where("groupName", ">=", searchQuery)
          .where("groupName", "<=", searchQuery + "\uf8ff")
          .get();
      }

      const results = querySnapshot.docs.map((doc) => doc.data());

      const filteredResults = results.filter((group) => {
        // '코드'를 선택중일 때
        if (selectedButton === 1) {
          // 이미 속해 있는 그룹이 아닌 경우만 반환
          return !userGroups.includes(group.groupName);
        } else if (selectedButton === 2) {
          // '이름'을 선택중일 때, 이미 속해 있는 그룹이 아니면서, 그룹의 공개 범위가 '전체 공개'인 그룹만 반환
          return (
            !userGroups.includes(group.groupName) &&
            group.groupRange === "전체 공개"
          );
        }
        return false; // 혹시나 다른 상태가 있을 경우를 대비하여 추가한 부분
      });

      setSearchResults(filteredResults);
    } catch (error) {
      console.log(error);
    }
  };

  // 그룹 참가를 신청한 경우. (대기자로 분류될 경우)
  async function sendapplyPushNotification(expoPushToken, userName, imgurl) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "그룹 참가 알림",
      body: userName + "님이 그룹에 참가를 신청했습니다.",
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

  const sendapplyPushAlarm = async (groupName) => {
    const Memberquery = firebase
      .firestore()
      .collection("users")
      .doc(currentUser.email)
      .get();
    const MemberName = (await Memberquery).data().UserName;
    const Memberimgurl = (await Memberquery).data().imgurl;

    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(groupName)
      .get();

    const groupmanager = (await GroupimgRef).data().groupManager;

    const groupmanagerRef = firebase
      .firestore()
      .collection("users")
      .doc(groupmanager)
      .collection("Token")
      .doc("Token")
      .get();

    if ((await groupmanagerRef).exists) {
      const groupmanagerToken = (await groupmanagerRef).data().token;
      console.log(groupmanagerToken);

      sendapplyPushNotification(groupmanagerToken, MemberName, Memberimgurl);
    }
  };

  //그룹에 바로 참가했을 경우. (자동 참가일 경우)
  async function sendjoinPushNotification(expoPushToken, userName, imgurl) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "그룹 참가 알림",
      body: userName + "님이 그룹에 참가하셨습니다.",
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

  const sendjoinPushAlarm = async (groupName) => {
    const Memberquery = firebase
      .firestore()
      .collection("users")
      .doc(currentUser.email)
      .get();
    const MemberName = (await Memberquery).data().UserName;
    const Memberimgurl = (await Memberquery).data().imgurl;

    const GroupimgRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(groupName)
      .get();

    const groupmanager = (await GroupimgRef).data().groupManager;

    const groupmanagerRef = firebase
      .firestore()
      .collection("users")
      .doc(groupmanager)
      .collection("Token")
      .doc("Token")
      .get();

    if ((await groupmanagerRef).exists) {
      const groupmanagerToken = (await groupmanagerRef).data().token;
      console.log(groupmanagerToken);

      sendjoinPushNotification(groupmanagerToken, MemberName, Memberimgurl);
    }
  };

  //그룹 추가 함수.
  const addGroup = async (groupName) => {
    const user = firebase.auth().currentUser;

    //현재 사용자 이름 받아오기.
    const Memberquery = firebase
      .firestore()
      .collection("users")
      .doc(currentUser.email)
      .get();
    const MemberName = (await Memberquery).data().UserName;
    const Memberimg = (await Memberquery).data().imgurl;

    const docRef = firebase
      .firestore()
      .collection("Group calendar")
      .doc(groupName);

    docRef.get().then((doc) => {
      if (doc.exists) {
        const data = doc.data();
        const groupmanager = data.groupManager;
        const groupimg = data.groupimg;
        const approvaldata = data.groupJoin; //참가 방식 데이터를 approvaldata에 담기.
        console.log(approvaldata);
        const CreatedAt = new Date().getTime();

        // 여기에서 approvaldata를 사용할 수 있음
        // 참가 방식에 따라 if, else로 그룹원으로 바로 추가 or 참가 대기로 추가.
        if (approvaldata === "자동 참가") {
          firebase
            .firestore()
            .collection("Group calendar")
            .doc(groupName)
            .collection("그룹원")
            .doc(user.email)
            .set({
              name: MemberName,
              email: user.email,
              power: "멤버",
              imgurl: Memberimg,
              created_at: firebase.firestore.FieldValue.serverTimestamp(),
            });

          firebase
            .firestore()
            .collection("users")
            .doc(firebase.auth().currentUser.email)
            .collection("Group")
            .doc(groupName)
            .set({
              groupName: groupName,
              groupimg: groupimg,
              created_at: CreatedAt,
              isTogether: false,
            });

          firebase
            .firestore()
            .collection("users")
            .doc(groupmanager)
            .collection("알림")
            .doc(groupName + "으로 그룹 참가 알림")
            .set({
              name: groupName, //email이 필요 없는 이유: 대기자 관리는 그룹 설정에서 처리하기 때문.
              writer: MemberName,
              profileImageUrl: groupimg,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              match: "그룹 참가 알림",
            });

          sendjoinPushAlarm(groupName);
          Alert.alert("알림", "그룹에 참가되셨습니다.");
        } else {
          firebase
            .firestore()
            .collection("Group calendar")
            .doc(groupName)
            .collection("참가 대기")
            .doc(user.email)
            .set({
              name: MemberName,
              email: user.email,
              power: "멤버",
              imgurl: Memberimg,
              created_at: firebase.firestore.FieldValue.serverTimestamp(),
            });

          firebase
            .firestore()
            .collection("users")
            .doc(groupmanager)
            .collection("알림")
            .doc(groupName + "으로 그룹 신청 알림")
            .set({
              name: groupName, //email이 필요 없는 이유: 대기자 관리는 그룹 설정에서 처리하기 때문.
              writer: MemberName,
              profileImageUrl: groupimg,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              match: "그룹 신청 알림",
            });

          sendapplyPushAlarm(groupName);
          Alert.alert("알림", "그룹에 참가 대기 상태입니다.");
        }
      }
    });

    const updatedSearchResults = searchResults.filter(
      (group) => group.groupName !== groupName
    );
    setSearchResults(updatedSearchResults);
  };

  //그룹 검색 방식 만들기(그룹 코드와 그룹 이름)
  const [selectedButton, setSelectedButton] = useState(1); // 1 또는 2로 초기화
  //그룹 검색시 TextInput조건문 만들기
  const [inputWarning, setInputWarning] = useState(false);

  const handleInputChange = (text) => {
    setSearchQuery(text);

    if (selectedButton === 1 && text.length < 4) {
      setInputWarning(true);
    } else if (selectedButton === 2 && text.length < 2) {
      setInputWarning(true);
    } else {
      setInputWarning(false);
    }
  };

  //비밀번호 설정방 / 비밀번호 입력하도록
  // 1. 상태 설정
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handlePasswordJoin = () => {
    if (password === group.passwordValue) {
      addGroup(group.groupName);
      setShowPasswordInput(false);
      setPassword("");
    } else {
      alert("비밀번호가 틀렸습니다.");
    }
  };

  //검색오류시 붉게
  const [isInvalidInput, setIsInvalidInput] = useState(false);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        onClose();
      }}
    >
      <View style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}>
        {/* 최상단 바 */}
        <View
          style={{
            paddingTop: Platform.OS === "ios" ? 54 : 24,
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderBottomWidth: 1,
            borderColor: "#e0e0e0",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setShowPasswordInput(false);
              setSearchQuery(""); // TextInput 초기화
              setSearchResults([]); // FlatList 초기화
              onClose(); // 원래의 onClose 로직 수행
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
            그룹 참가
          </Text>
          <View style={{ width: 25 }}>
            {/* 빈 공간으로 아이콘과 텍스트 위치 조정 */}
          </View>
        </View>

        {/* 검색 바 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            paddingTop: 30,
          }}
        >
          <TouchableOpacity
            style={[
              {
                borderWidth: 1,
                borderColor: selectedButton === 1 ? "black" : "grey",
                padding: 8,
                marginHorizontal: 5,
                shadowColor: selectedButton === 1 ? "black" : "transparent",
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
              },
            ]}
            onPress={() => {
              setSearchQuery(""); // TextInput 초기화
              setSearchResults([]); // FlatList 초기화
              setSelectedButton(1); // 원래의 onClose 로직 수행
            }}
          >
            <Text style={{ color: selectedButton === 1 ? "black" : "grey" }}>
              코드
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              {
                borderWidth: 1,
                borderColor: selectedButton === 2 ? "black" : "grey",
                padding: 8,
                marginHorizontal: 5,
                shadowColor: selectedButton === 2 ? "black" : "transparent",
                shadowOffset: { width: 1, height: 1 },
                shadowOpacity: 0.3,
                shadowRadius: 2,
              },
            ]}
            onPress={() => {
              setSearchQuery(""); // TextInput 초기화
              setSearchResults([]); // FlatList 초기화
              setSelectedButton(2); // 원래의 onClose 로직 수행
            }}
          >
            <Text style={{ color: selectedButton === 2 ? "black" : "grey" }}>
              이름
            </Text>
          </TouchableOpacity>

          <TextInput
            value={searchQuery}
            style={[
              styles.textInput,
              {
                marginLeft: 20,
                flex: 0.8,
                textAlign: "left",
                color: inputWarning ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.8)",
              },
            ]}
            placeholder={
              selectedButton === 1 ? "그룹의 코드 입력" : "그룹의 이름 입력"
            }
            placeholderTextColor="#BBB"
            onChangeText={handleInputChange}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {inputWarning && (
            <Text
              style={{
                color: isInvalidInput ? "red" : "grey",
                fontSize: 12,
                marginLeft: 25,
              }}
            >
              {selectedButton === 1 ? "(4자리 이상 입력)" : "(2자리 이상 입력)"}
            </Text>
          )}
          <TouchableOpacity
            style={{
              flex: 0.1,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={() => {
              if (
                (selectedButton === 1 && searchQuery.length >= 4) ||
                (selectedButton === 2 && searchQuery.length >= 2)
              ) {
                setIsInvalidInput(false); // 유효한 입력
                searchGroups();
              } else {
                setIsInvalidInput(true); // 유효하지 않은 입력
                setSearchResults([]); // FlatList 초기화
              }
            }}
          >
            <Icon name="search" size={22}></Icon>
          </TouchableOpacity>
        </View>
        {/* 100% width 줄 */}
        <View
          style={{
            width: "100%",
            height: 1,
            backgroundColor: "#000",
            margin: 10,
          }}
        ></View>

        {/* 검색 결과 */}
        <FlatList
          style={{ width: "100%" }}
          contentContainerStyle={{}}
          data={searchResults}
          keyExtractor={(group) => group.groupName}
          renderItem={({ item: group }) => {
            const user = firebase.auth().currentUser;

            const userRef = firebase
              .firestore()
              .collection("users")
              .doc(user.email);

            const groupRef = userRef.collection("Group").doc(group.groupName);

            return (
              <View style={{ width: "100%" }}>
                <View key={group.groupName}>
                  <View
                    style={{
                      width: "100%",
                      flexDirection: "row",
                      alignItems: "center",
                      paddingBottom: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#ccc",
                      paddingVertical: 2,
                    }}
                  >
                    {group.groupimg ? (
                      <Image
                        source={{ uri: group.groupimg }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 50,
                          marginLeft: 10,
                          marginRight: 10, // 추가된 부분
                        }}
                      />
                    ) : (
                      <Text>No Image?</Text>
                    )}
                    <Text style={{ flex: 1 }}>{group.groupName}</Text>

                    {/* Render different component if group is already added */}
                    {group.passwordEnabled ? (
                      <>
                        {/*  비밀번호 입력 후 */}
                        {showPasswordInput ? (
                          <View
                            style={{
                              flexDirection: "row",
                              justifyContent: "flex-end",
                            }}
                          >
                            <TextInput
                              style={{
                                width: "45%",
                                backgroundColor: "rgba(200,200,200,0.3)",
                                marginRight: 5,
                                /* 여기에 스타일을 추가하세요 */
                              }}
                              placeholder="비밀번호 입력"
                              placeholderTextColor={"rgba(0,0,0,0.3)"}
                              value={password}
                              onChangeText={setPassword}
                              secureTextEntry
                            />
                            <TouchableOpacity
                              style={{
                                backgroundColor: "rgb(80, 80, 80)",
                                borderRadius: 15,
                                width: 54,
                                height: 30,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 10,
                              }}
                              onPress={() => {
                                if (password === group.passwordValue) {
                                  addGroup(group.groupName);
                                  setShowPasswordInput(false);
                                  setPassword("");
                                } else {
                                  alert("비밀번호가 틀렸습니다.");
                                }
                              }}
                            >
                              <Text
                                style={{
                                  color: "rgba(255,255,255,0.9)",
                                  fontWeight: "500",
                                  fontSize: 14,
                                }}
                              >
                                참가
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <>
                            <Icon
                              name="lock"
                              size={16}
                              color="rgba(5,5,5,0.8)"
                              style={{ marginRight: 4 }}
                            />
                            <TouchableOpacity
                              style={{
                                backgroundColor: "rgb(80, 80, 80)",
                                borderRadius: 15,
                                width: 54,
                                height: 30,
                                justifyContent: "center",
                                alignItems: "center",
                                marginRight: 10,
                              }}
                              onPress={() => setShowPasswordInput(true)}
                            >
                              <Text
                                style={{
                                  color: "rgba(255,255,255,0.9)",
                                  fontWeight: "500",
                                  fontSize: 14,
                                }}
                              >
                                암호
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      </>
                    ) : (
                      <TouchableOpacity
                        style={{
                          backgroundColor: "rgb(80, 80, 80)",
                          borderRadius: 15,
                          width: 54,
                          height: 30,
                          justifyContent: "center",
                          alignItems: "center",
                          marginRight: 10,
                        }}
                        onPress={() => addGroup(group.groupName)}
                      >
                        <Text
                          style={{
                            color: "rgba(255,255,255,0.9)",
                            fontWeight: "500",
                            fontSize: 14,
                          }}
                        >
                          참가
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  textInput: {
    width: "100%",
    fontSize: 20,
    textAlign: "center",
    color: "rgba(0,0,0,0.8)",
  },
});
