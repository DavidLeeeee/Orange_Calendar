import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Button,
  Image,
} from "react-native";
import { firebase } from "../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

export default function Find_Friend() {
  const [modalVisible, setModalVisible] = useState(false);

  //친구 찾기 관련
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  const searchFriends = async () => {
    try {
      const user = firebase.auth().currentUser;

      if (selectedButton === 1 && searchQuery.length >= 4) {
        // 코드로 검색
        const identifyDocRef = firebase
          .firestore()
          .collection("identify")
          .doc(searchQuery[0]);
        const usersInIdentifyCollection = await identifyDocRef
          .collection(searchQuery)
          .get();

        const results = usersInIdentifyCollection.docs.map((doc) => doc.data());

        // 이미 친구로 추가된 이메일과 현재 사용자의 이메일을 제외
        const filteredResults = results.filter(
          (friend) => friend.email !== user.email
        );

        setSearchResults(filteredResults);
      } else if (selectedButton === 2) {
        // 이름으로 검색 (기존의 로직)
        // 현재 로직을 그대로 유지...
      } else {
        Alert.alert("코드를 4자리 이상 입력해주세요.");
        return;
      }
    } catch (error) {
      console.log(error);
    }
  };

  const addFriend = async (friend) => {
    //친구 계정의 알림에 데이터를 저장. 수락/거절은 알림에서 해줄 것임.
    //"친구 추가 알림"으로 저장해서 알림에서 분류 후 수락 거절 보이게
    //필요한 정보: 친구 이메일만 있으면 됨.
    try {
      const user = firebase.auth().currentUser;

      const userRef = firebase
        .firestore()
        .collection("users")
        .doc(user.email)
        .get();

      const currentUserName = (await userRef).data().UserName;
      const currentUserImageUrl = (await userRef).data().imgurl;

      console.log(currentUserImageUrl, currentUserName);

      const userFriendsRef = firebase
        .firestore()
        .collection("users")
        .doc(friend.email)
        .collection("알림")
        .doc(currentUserName + "님의 친구 추가 알림");

      await userFriendsRef.set({
        name: currentUserName,
        email: user.email,
        profileImageUrl: currentUserImageUrl,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        match: "친구 추가 알림",
      });

      setSearchResults((prevResults) =>
        prevResults.filter((result) => result.email !== friend.email)
      );

      Alert.alert(
        "친구 추가",
        `${friend.UserName}님에게 친구 신청을 보냈습니다.`
      );
    } catch (error) {
      console.log("Error adding friend: ", error);
    }
  };

  //친구 검색
  const [selectedButton, setSelectedButton] = useState(1); // 1 또는 2로 초기화

  //검색버튼 활성화하기
  const [isButtonActive, setIsButtonActive] = useState(false); // 추가: 버튼 활성화 상태를 추적하기 위한 상태

  // 푸쉬 알림 전송.
  async function sendPushNotification(expoPushToken, userName, imgurl) {
    // 토큰 확인.
    console.log(expoPushToken);

    //푸시 알림 메세지.
    const message = {
      to: expoPushToken,
      sound: "default",
      title: "친구 추가 알림",
      body: userName + "님이 친구 추가를 보냈습니다.",
      data: { imgurl: imgurl }, // 객체 형식으로 변경
    };

    // Expo의 푸시 알림 API(https://exp.host/--/api/v2/push/send)에 POST 요청을 보냅니다.
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message), // 메세지와 함께 요청 전송.
    });

    console.log("응답:", await response.json());
  }

  // 푸시 알림을 보내기 위한 값 준비.
  const sendPushAlarm = async (friend) => {
    const user = firebase.auth().currentUser;

    const userRef = firebase
      .firestore()
      .collection("users")
      .doc(user.email)
      .get();

    const currentUserName = (await userRef).data().UserName;
    const currentUserImageUrl = (await userRef).data().imgurl;

    // 친구가 발급 받은 토큰을 가져옴.
    const userFriendsRef = firebase
      .firestore()
      .collection("users")
      .doc(friend.email)
      .collection("Token")
      .doc("Token")
      .get();

    // 친구가 로그인된 상태일 때. 토큰이 있을 때만 전송.
    if ((await userFriendsRef).exists) {
      const friendToken = (await userFriendsRef).data().token;
      console.log(friendToken);

      // 푸시 알림을 보내는 함수 호출.
      sendPushNotification(friendToken, currentUserName, currentUserImageUrl);
    }
  };

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View
            style={[
              styles.modalView,
              signatureStyles ? signatureStyles.background : {},
            ]}
          >
            {/* 최상단 바 */}
            <View
              style={{
                marginLeft: 15,
                marginVertical: 20,
                flexDirection: "row",
                alignItems: "center",
                borderColor: "#e0e0e0",
                // iOS 그림자 스타일
                shadowColor: "#000",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  // 모달 상태 변경
                  setModalVisible(!modalVisible);
                  // 검색 결과 및 입력값 초기화
                  setSearchResults([]);
                  setSearchQuery("");
                }}
                style={{ alignItems: "flex-end" }}
              >
                <Icon
                  name="arrow-back"
                  size={25}
                  style={[signatureStyles ? signatureStyles.Textcolor : {}]}
                ></Icon>
              </TouchableOpacity>
              <Text
                style={[
                  {
                    flex: 1,
                    textAlign: "center",
                    fontWeight: "400",
                    fontSize: 18,
                  },
                  signatureStyles ? signatureStyles.Textcolor : {},
                ]}
              >
                친구 추가
              </Text>
              <View style={{ width: 40 }}>
                {/* 빈 공간으로 아이콘과 텍스트 위치 조정 */}
              </View>
            </View>

            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: "100%",
                  paddingTop: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  borderColor: "#e0e0e0",
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  style={[
                    {
                      borderWidth: 1,
                      borderColor: selectedButton === 1 ? "black" : "grey",
                      padding: 8,
                      marginHorizontal: 5,
                      shadowColor:
                        selectedButton === 1 ? "black" : "transparent",
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
                  <Text
                    style={[
                      { color: selectedButton === 1 ? "black" : "grey" },
                      signatureStyles ? signatureStyles.Textcolor : {},
                    ]}
                  >
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
                      shadowColor:
                        selectedButton === 2 ? "black" : "transparent",
                      shadowOffset: { width: 1, height: 1 },
                      shadowOpacity: 0.3,
                      shadowRadius: 2,
                    },
                  ]}
                  onPress={() => {
                    setSearchQuery(""); // TextInput 초기화
                    setSearchResults([]); // FlatList 초기화
                    setSelectedButton(2); // 원래의 onClose 로직 수행
                    setIsButtonActive(false); // 검색 버튼 비활성화********************
                  }}
                >
                  <Text
                    style={[
                      { color: selectedButton === 2 ? "black" : "grey" },
                      signatureStyles ? signatureStyles.Textcolor : {},
                    ]}
                  >
                    이름
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={{
                  marginVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderRadius: 0,
                  paddingHorizontal: 5,
                  width: "90%",
                  backgroundColor: "rgba(200,200,200,0.1)",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    width: "40%",
                    height: 46,
                  }}
                >
                  <Text
                    style={{ marginRight: 10, fontSize: 22, color: "#444" }}
                  >
                    #
                  </Text>

                  <TextInput
                    value={searchQuery}
                    style={[
                      styles.textInput,
                      {
                        fontSize: selectedButton === 1 ? 20 : 16, // '코드' 선택시 20, '이름' 선택시 16
                      },
                      signatureStyles ? signatureStyles.Textcolor : {},
                    ]}
                    placeholder={
                      selectedButton === 1 ? "CODE" : "사용할 수 없는 기능"
                    } // 선택된 버튼에 따라 placeholder 변경
                    placeholderTextColor="#BBB"
                    maxLength={4}
                    editable={selectedButton === 1} // '코드' 선택시에만 편집 가능
                    onChangeText={(text) => {
                      if (selectedButton === 1) {
                        // '코드' 선택시에만 동작
                        const upperCaseText = text.toUpperCase();
                        setSearchQuery(upperCaseText);

                        if (upperCaseText.length >= 4) {
                          setIsButtonActive(true);
                        } else {
                          setIsButtonActive(false);
                        }
                      }
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    keyboardType="default"
                  />
                </View>

                <Button
                  onPress={() => {
                    searchFriends(); // 기존의 검색 함수 실행
                    setSearchQuery(""); // TextInput 초기화
                  }}
                  title="Search"
                  color={isButtonActive ? "rgba(40,80,250,1)" : "grey"}
                  disabled={!isButtonActive}
                />
              </View>

              <View style={{ padding: 5 }}></View>

              <FlatList
                style={{ width: "100%" }}
                data={searchResults} //검색해서 가져온 데이터 (친구 email)
                keyExtractor={(friend) => friend.email}
                renderItem={({ item: friend }) => {
                  //중복 확인 하는 코드.
                  const user = firebase.auth().currentUser;
                  const userRef = firebase //내정보 가져오기
                    .firestore()
                    .collection("users")
                    .doc(user.email);
                  const userFriendsRef = userRef //친구 email정보 가져오기
                    .collection("friends")
                    .doc(friend.email); // 이게 중복 확인의 핵심 코드임.

                  return (
                    <View key={friend.email}>
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottomWidth: 0.3,
                          borderBottomColor: "#ccc",
                          paddingVertical: 5,
                        }}
                      >
                        <View
                          style={{
                            width: "30%",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginLeft: 5,
                          }}
                        >
                          <Image
                            source={{ uri: friend.imgurl }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 50,
                            }}
                          />
                          <Text
                            style={[
                              signatureStyles ? signatureStyles.Textcolor : {},
                            ]}
                          >
                            {friend.UserName}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={{
                            marginRight: 10,
                            backgroundColor: "skyblue",
                            padding: 6,
                            borderRadius: 10,
                          }}
                          onPress={() => {
                            addFriend(friend);
                            sendPushAlarm(friend);
                          }}
                        >
                          <Text>추가</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }}
              />
              <View style={{ padding: 10 }}></View>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        //   style={[styles.button, styles.buttonClose]}
        onPress={() => setModalVisible(true)}
      >
        <Text
          style={[
            {
              bottom: 5,
              fontSize: 14,
              fontWeight: "500",
              color: "grey",
            },
            signatureStyles ? signatureStyles.Textcolor : {},
          ]}
        >
          친구 추가
        </Text>
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
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "rgba(250,250,250,1)", //여기에 적용하기
    borderRadius: 20,
    width: "70%",
    height: "60%",
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
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  friendList: {
    width: "100%",
    backgroundColor: "lightgray",
    borderRadius: 5,
    padding: 10,
  },
  textInput: {
    width: 120,
    color: "#333",
    fontSize: 20,
    textAlign: "left",
  },
});
