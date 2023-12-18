import React, { useEffect, useState } from "react";
import { firebase } from "../../../Afirebaseconfig";
import {
  Alert,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScrollView, TextInput } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";

export default function Admin() {
  const db = firebase.firestore();
  const [inquiries, setInquiries] = useState([]);
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [answer, setAnswer] = useState("");
  const [informVisible, setInformVisible] = useState(false);
  const [informContent, setInformContent] = useState("");

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const openModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setModalVisible(true);
  };

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        getInquiries();
      }
    });

    // Clean up the subscription.
    return unsubscribe;
  }, []);

  const getInquiries = async () => {
    try {
      // 사용자의 '문의' 컬렉션에 대한 참조를 가져옵니다.
      const inquiriesRef = db
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("문의")
        .orderBy("created_at", "desc");

      // onSnapshot을 사용하여 '문의' 컬렉션의 변화를 실시간으로 감시합니다.
      const unsubscribe = inquiriesRef.onSnapshot(
        (snapshot) => {
          const newInquiries = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 가져온 데이터로 상태를 업데이트합니다.
          setInquiries(newInquiries);
        },
        (err) => {
          console.error("Failed to subscribe to inquiries collection: ", err);
        }
      );

      // 컴포넌트가 언마운트될 때 리스너를 해제합니다.
      return () => unsubscribe();
    } catch (error) {
      console.error("Error getting inquiries: ", error);
    }
  };

  // 질문자에게 답변과 질문도 같이 보내줘서 띄운다.
  const giveAnswer = async () => {
    const CreatedAt = new Date().getTime();

    if (selectedInquiry && answer.trim()) {
      // 여기서 답변을 처리하는 로직을 구현합니다.
      // 예를 들어, Firestore에 답변을 저장할 수 있습니다.

      // 선택된 질문에 대한 참조를 가져옵니다.
      db.collection("users")
        .doc(selectedInquiry.writer)
        .collection("문의")
        .doc(selectedInquiry.title)
        .update({
          title: selectedInquiry.title,
          content: selectedInquiry.content,
          answer: answer,
          created_at: CreatedAt,
        });

      // 모달을 닫고 상태를 초기화합니다.
      setModalVisible(false);
      setSelectedInquiry(null);
      setAnswer("");
    }

    const inquiriesRef = db
      .collection("users")
      .doc(firebase.auth().currentUser.email)
      .collection("문의")
      .doc(selectedInquiry.writer + "님의 문의: " + selectedInquiry.title);
    inquiriesRef.delete();
  };

  async function sendPushNotification(expoPushToken) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "공지 알림",
      body: "공지가 등록되었습니다.",
      data: { someData: "nothing" }, // 객체 형식으로 변경
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

  const sendPushAlarm = async (userEmail) => {
    const userUsersRef = firebase
      .firestore()
      .collection("users")
      .doc(userEmail)
      .collection("Token")
      .doc("Token")
      .get();

    // 친구가 로그인된 상태일 때. = 토큰이 있을 때만 전송.
    if ((await userUsersRef).exists) {
      const UserToken = (await userUsersRef).data().token;
      console.log(UserToken);

      sendPushNotification(UserToken);
    }
  };

  const informEveryone = async () => {
    try {
      const userRef = db.collection("users");
      const snapshot = await userRef.get();

      // Firestore 쓰기 작업을 효율적으로 관리하기 위한 batch 생성
      const batch = db.batch();

      snapshot.forEach((doc) => {
        if (doc.id === "orangeadmin@secret.com") {
          return; // 관리자 계정 건너뛰기.
        }

        const firstFourLetters = informContent.substring(0, 4);

        const userId = doc.id;
        const notificationRef = userRef
          .doc(userId)
          .collection("알림")
          .doc(firstFourLetters + "공지 알림"); // 새 알림 문서 ID 자동 생성

        // 알림 데이터 설정
        const notificationData = {
          // 여기에 알림에 필요한 데이터 필드를 추가하세요
          schedule: informContent,
          match: "공지 알림",
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        };

        sendPushAlarm(doc.id);
        // batch에 쓰기 작업 추가
        batch.set(notificationRef, notificationData);
      });

      Alert.alert("공지 알림", "공지가 등록되었습니다.");
      setInformVisible(false);
      setInformContent("");

      // 모든 쓰기 작업을 한 번에 커밋
      await batch.commit();
      console.log("모든 사용자에게 알림이 전송되었습니다.");
    } catch (error) {
      console.error("알림 전송 중 오류 발생:", error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        marginTop: "10%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          paddingBottom: 10,
          paddingHorizontal: 15,
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
            Alert.alert(
              "관리자 알림",
              "관리자 화면을 나갑니다.",
              [
                {
                  text: "취소",
                  style: "cancel",
                },
                {
                  text: "확인",
                  onPress: async () => {
                    try {
                      const userEmail = firebase.auth().currentUser.email;

                      if (userEmail) {
                        await db
                          .collection("users")
                          .doc(userEmail)
                          .collection("Token")
                          .doc("Token")
                          .delete();

                        console.log("Deleted token for: ", userEmail);

                        firebase.auth().signOut();
                      } else {
                        console.log("No user is currently signed in.");
                      }
                    } catch (error) {
                      console.error("Error deleting token: ", error);
                    }
                  },
                },
              ],
              { cancelable: false }
            );
          }}
        >
          <Icon name="arrow-back" size={25} color="black" />
        </TouchableOpacity>

        <Text style={styles.modalText}>관리자</Text>
        <View style={{ width: 25 }}></View>
      </View>

      <TouchableOpacity
        style={{
          margin: 25,
          width: "90%",
          height: 30,
          backgroundColor: "white",
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 0.5,
          borderColor: "black",
          borderRadius: 8,
        }}
        onPress={() => {
          setInformVisible(true);
        }}
      >
        <Text>공지 작성</Text>
      </TouchableOpacity>

      <ScrollView style={{ width: "100%" }}>
        {inquiries.map((inquiry, index) => (
          <View
            key={inquiry.id}
            style={{
              padding: 10,
              borderBottomWidth: 1,
              borderBottomColor: "#ccc",
            }}
          >
            <Text style={{ fontWeight: "bold" }}>
              {index + 1}. {inquiry.title}
            </Text>
            <Text>{inquiry.content}</Text>
            <Text>질문자: {inquiry.writer}</Text>

            <TouchableOpacity
              style={{
                margin: 10,
                width: "94%",
                height: 30,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
                alignSelf: "center",
                borderWidth: 0.5,
                borderColor: "black",
                borderRadius: 8,
              }}
              onPress={() => openModal(inquiry)}
            >
              <Text>답변 작성</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {selectedInquiry && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPressOut={() => Keyboard.dismiss()}
          >
            <View
              style={{
                width: 350,
                height: 600,
                backgroundColor: "white",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: "100%",
                  paddingBottom: 10,
                  marginBottom: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  borderColor: "#e0e0e0",
                  borderBottomWidth: 0.5,
                  // iOS 그림자 스타일
                  shadowColor: "#000",
                }}
              >
                <Text style={styles.modalText}>답변 작성</Text>
              </View>

              <ScrollView style={styles.questionScrollView}>
                <Text style={styles.questiontext}>
                  질문: {selectedInquiry.content}
                </Text>
              </ScrollView>

              <TextInput
                style={styles.contentinput}
                placeholder="내용"
                placeholderTextColor={"lightgrey"}
                onChangeText={(content) => setAnswer(content)}
                autoCorrect={false}
                value={answer}
                multiline={true} // 여러 줄 입력 활성화
                numberOfLines={15}
              />

              <TouchableOpacity
                style={{
                  marginTop: 25,
                  width: "90%",
                  height: 30,
                  backgroundColor: "rgba(0,156,255, 1)",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 0.5,
                  borderColor: "rgba(0,156,255, 1)",
                  borderRadius: 8,
                }}
                onPress={() => {
                  giveAnswer();
                  setAnswer("");
                }}
              >
                <Text style={{ fontSize: 16, color: "white" }}>등록</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  marginTop: 5,
                  width: "90%",
                  height: 30,
                  backgroundColor: "white",
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 0.5,
                  borderColor: "black",
                  borderRadius: 8,
                }}
                onPress={() => {
                  setModalVisible(false);
                  setAnswer("");
                }}
              >
                <Text style={{ fontSize: 16 }}>취소</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={informVisible}
        onRequestClose={() => {
          setInformVisible(false);
          setInformContent("");
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.3)",
            justifyContent: "center",
            alignItems: "center",
          }}
          activeOpacity={1}
          onPressOut={() => Keyboard.dismiss()}
        >
          <View
            style={{
              width: 350,
              height: 600,
              backgroundColor: "white",
              borderRadius: 10,
              padding: 10,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: "100%",
                paddingBottom: 10,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                borderColor: "#e0e0e0",
                borderBottomWidth: 0.5,
                // iOS 그림자 스타일
                shadowColor: "#000",
              }}
            >
              <Text style={styles.modalText}>공지 작성</Text>
            </View>
            <TextInput
              style={styles.contentinput}
              placeholder="내용"
              placeholderTextColor={"lightgrey"}
              onChangeText={(content) => setInformContent(content)}
              autoCorrect={false}
              value={informContent}
              multiline={true} // 여러 줄 입력 활성화
              numberOfLines={15}
            />

            <TouchableOpacity
              style={{
                marginTop: 25,
                width: "90%",
                height: 30,
                backgroundColor: "rgba(0,156,255, 1)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 0.5,
                borderColor: "rgba(0,156,255, 1)",
                borderRadius: 8,
              }}
              onPress={() => {
                informEveryone();
                setInformContent("");
              }}
            >
              <Text style={{ fontSize: 16, color: "white" }}>등록</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                marginTop: 5,
                width: "90%",
                height: 30,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 0.5,
                borderColor: "black",
                borderRadius: 8,
              }}
              onPress={() => {
                setInformVisible(false);
                setInformContent("");
              }}
            >
              <Text style={{ fontSize: 16 }}>취소</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalContanier: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTab: {
    width: 350,
    height: 400,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: "white",
    padding: 7,
  },
  InformTab: {
    width: 350,
    height: 350,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: "white",
    padding: 7,
  },
  contentinput: {
    marginTop: 10,
    width: "90%",
    height: 360,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.3)",
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
  answerinput: {
    marginTop: 10,
    width: "90%",
    height: 360,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.3)",
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
  questiontext: {
    width: "100%",
    height: 45,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderColor: "rgba(0,0,0,0.3)",
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
  questionScrollView: {
    width: "80%",
    backgroundColor: "skyblue",
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 10,
  },
});
