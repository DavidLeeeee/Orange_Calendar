import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  TextInput,
} from "react-native";
//import { ScrollView, TextInput } from "react-native-gesture-handler";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";

export default function InquiryPage(props) {
  const [ASKmodalVisible, setASKModalVisible] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const db = firebase.firestore();

  const writeInquiries = (title, content) => {
    const CreatedAt = new Date().getTime();

    Alert.alert("문의 전송 성공", "문의가 전송되었습니다.");

    try {
      db.collection("users")
        .doc("orangeadmin@secret.com")
        .collection("문의")
        .doc(firebase.auth().currentUser.email + "님의 문의: " + title)
        .set({
          title: title,
          content: content,
          writer: firebase.auth().currentUser.email,
          created_at: CreatedAt,
        });

      db.collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("문의")
        .doc(title)
        .set({
          title: title,
          content: content,
          answer: "답변 진행중",
          created_at: CreatedAt,
        });

      setTitle("");
      setContent("");
      setASKModalVisible(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Error getting inquiries: ", error);
    }
  };

  const deleteInquiries = async (title) => {
    const docAnswer = await db
      .collection("users")
      .doc(firebase.auth().currentUser.email)
      .collection("문의")
      .doc(title)
      .get();

    const isAnswered = docAnswer.data().answer;

    if (isAnswered === "답변 진행중") {
      Alert.alert(
        "문의 알림",
        "아직 답변이 오지 않았습니다. 삭제하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "확인",
            onPress: async () => {
              try {
                db.collection("users")
                  .doc(firebase.auth().currentUser.email)
                  .collection("문의")
                  .doc(title)
                  .delete();

                db.collection("users")
                  .doc("orangeadmin@secret.com")
                  .collection("문의")
                  .doc(
                    firebase.auth().currentUser.email + "님의 문의: " + title
                  )
                  .delete();
              } catch (error) {
                console.error("Error getting inquiries: ", error);
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      db.collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("문의")
        .doc(title)
        .delete();
    }
  };

  return (
    <View>
      <Modal
        animationType="fade"
        transparent={true}
        visible={props.modalVisible}
        onRequestClose={() => {
          props.onClose();
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 350,
              height: 600,
              borderWidth: 2,
              borderRadius: 10,
              backgroundColor: "white",
              padding: 7,
            }}
          >
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
              {/* 모달창 닫기 버튼 */}
              <TouchableOpacity
                style={{ alignItems: "flex-end" }}
                onPress={() => {
                  props.onClose();
                  setTitle("");
                  setContent("");
                }}
              >
                <Icon name="arrow-back" size={25} color="black" />
              </TouchableOpacity>

              <Text style={styles.modalText}>1:1 문의</Text>
              <View style={{ width: 20 }}></View>
            </View>

            <View
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 5,
                justifyContent: "space-between",
              }}
            >
              <Text style={{ alignSelf: "center" }}>문의 목록</Text>

              <ScrollView
                style={{
                  backgroundColor: "rgba(250,250,250,1)",
                  width: "100%",
                  maxHeight: "80%",
                  marginBottom: 14,
                }}
              >
                {props.inquiries.map((inquiry, index) => (
                  <View
                    key={inquiry.id}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: "#ccc",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ width: "80%" }}>
                      <Text style={{ fontWeight: "bold" }}>
                        {index + 1}. {inquiry.id}
                      </Text>
                      <Text>{inquiry.content}</Text>
                      <Text>답변: {inquiry.answer}</Text>
                    </View>

                    <TouchableOpacity
                      style={{ alignItems: "center", justifyContent: "center" }}
                      onPress={() => deleteInquiries(inquiry.title)}
                    >
                      <Text>삭제</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  padding: 10,
                }}
                onPress={() => {
                  setASKModalVisible(true);
                  console.log(ASKmodalVisible);
                }}
              >
                <Text>문의하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={ASKmodalVisible}
        onRequestClose={() => {
          setASKModalVisible(false);
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 300,
              height: 400,
              borderRadius: 10,
              backgroundColor: "white",
              padding: 7,
            }}
          >
            <View
              style={{
                marginLeft: 5,
                paddingBottom: 10,
                marginBottom: 1,
                flexDirection: "row",
                alignItems: "center",
                borderColor: "#e0e0e0",
                // iOS 그림자 스타일
                shadowColor: "#000",
              }}
            >
              {/* 모달창 닫기 버튼 */}
              <TouchableOpacity
                style={{ alignItems: "flex-end" }}
                onPress={() => {
                  setASKModalVisible(false);
                  setTitle("");
                  setContent("");
                }}
              >
                <Icon name="arrow-back" size={25} color="black" />
              </TouchableOpacity>

              <Text style={styles.modalText}>문의하기</Text>
              <View style={{ width: 20 }}></View>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TextInput
                style={styles.titleinput}
                placeholder="제목"
                onChangeText={(title) => setTitle(title)}
                autoCorrect={false}
                value={title}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TextInput
                style={styles.contentinput}
                placeholder="내용"
                onChangeText={(content) => setContent(content)}
                autoCorrect={false}
                value={content}
                multiline={true} // 여러 줄 입력 활성화
                numberOfLines={15}
              />
            </View>

            <TouchableOpacity
              style={{ marginTop: 5 }}
              onPress={() => {
                writeInquiries(title, content);
              }}
            >
              <Text style={{ textAlign: "center" }}>등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
  titleinput: {
    width: "80%",
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
  contentinput: {
    width: "80%",
    height: 260,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
});
