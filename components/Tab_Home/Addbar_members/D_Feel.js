import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { firebase } from "../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

export default function Feel() {
  const [modalVisible, setModalVisible] = useState(false);

  //버튼에 쓰일 이미지
  const additionalButtons = [
    require("../../../assets/emotions/angry.png"),
    require("../../../assets/emotions/fun.png"),
    require("../../../assets/emotions/soso.png"),
    require("../../../assets/emotions/shame.png"),
    require("../../../assets/emotions/sad.png"),
    require("../../../assets/emotions/rock.png"),
  ];
  //각각의 단어에 맞는 이미지를 적용한다
  const emotionToImage = {
    angry: require("../../../assets/emotions/angry.png"),
    fun: require("../../../assets/emotions/fun.png"),
    soso: require("../../../assets/emotions/soso.png"),
    shame: require("../../../assets/emotions/shame.png"),
    sad: require("../../../assets/emotions/sad.png"),
    rock: require("../../../assets/emotions/rock.png"),
  };
  const emotionValues = ["angry", "fun", "soso", "shame", "sad", "rock"];

  //감정 추가 버튼 토글
  const [additionalButtonsVisible, setAdditionalButtonsVisible] =
    useState(false);
  const toggleAdditionalButtons = () => {
    setAdditionalButtonsVisible(!additionalButtonsVisible);
  };

  //날짜 데이터 불러오기
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const day = String(currentDate.getDate()).padStart(2, "0");
  const formattedDate = `${year}${month}${day}`;

  //오늘의 감정 등록하기
  const db = firebase.firestore();
  registerFeel = async (emotion) => {
    console.log("registerFeel function called with emotion:", emotion); // 로그 추가
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        db.collection("users")
          .doc(firebase.auth().currentUser.email)
          .collection("emotions")
          .doc(formattedDate)
          .set({
            feel: emotion,
            created_at: firebase.firestore.FieldValue.serverTimestamp(),
          })
          .then(() => {
            console.log("Document successfully written!", formattedDate); // 성공 로그 추가
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      }
    });
  };

  //감정 렌더링하기
  const handleAuthStateChanged = (user) => {
    if (user) {
      loadfeels();
    }
  };
  useEffect(() => {
    const unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuthStateChanged);

    // 사용자가 처음 로그인을 했을 경우에만 loadFriends() 함수를 호출
    if (firebase.auth().currentUser) {
      loadfeels();
    }
    return () => unsubscribe();
  }, []);

  const loadfeels = async () => {
    try {
      const db = firebase.firestore();
      const unsubscribe = db
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("emotions")
        .onSnapshot((snapshot) => {
          const newEmotions = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEmotions(newEmotions);
        });
    } catch (error) {
      console.log("Error loading feels: ", error);
    }
  };

  const [emotions, setEmotions] = useState([]);

  //감정 분류하여 표시하기
  const groupedEmotions = emotions.reduce((acc, emotionData) => {
    const groupKey = emotionData.id.substring(0, 6); // 연도와 달만 추출 (예: 202307)
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(emotionData);
    return acc;
  }, {});

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
            <View>
              <View
                style={{ alignItems: "center", height: "87%", width: "100%" }}
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
                  <TouchableOpacity
                    style={{ alignItems: "flex-end" }}
                    onPress={() => {
                      setModalVisible(!modalVisible),
                        setAdditionalButtonsVisible(false);
                    }}
                  >
                    <Icon name="arrow-back" size={25} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontWeight: "400",
                      fontSize: 18,
                    }}
                  >
                    이달의 감정
                  </Text>
                  <View style={{ width: 30 }}></View>
                </View>

                <ScrollView
                  style={{ width: 300, height: 300 }}
                  showsVerticalScrollIndicator={false}
                >
                  {Object.entries(groupedEmotions).map(
                    ([key, groupedEmotionList]) => (
                      <View key={key} style={{ width: "100%" }}>
                        <Text style={{ fontWeight: "500" }}>{key}</Text>

                        <View style={styles.imageContainer}>
                          {groupedEmotionList.map((emotionData) => {
                            const day = parseInt(
                              emotionData.id.substring(6, 8),
                              10
                            ).toString();
                            return (
                              <View key={emotionData.id}>
                                {emotionData.feel && (
                                  <View
                                    style={{
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Text>{day}일</Text>
                                    <Image
                                      source={emotionToImage[emotionData.feel]}
                                      style={styles.emotionImage}
                                    />
                                  </View>
                                )}
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )
                  )}
                </ScrollView>
              </View>
            </View>

            {/* 감정 추가 버튼 */}
            <TouchableOpacity onPress={toggleAdditionalButtons}>
              <Image
                source={require("../../../assets/feel.png")}
                style={{ width: 70, height: 70 }}
              />
            </TouchableOpacity>

            {additionalButtonsVisible && (
              <View
                style={{
                  position: "absolute",
                  flexDirection: "row",
                  marginTop: 10,
                  height: 70,
                  top: "75%",
                  backgroundColor: "rgba(240,240,240,1)",
                  borderRadius: 20,
                }}
              >
                {additionalButtons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      registerFeel(emotionValues[index]);
                      setAdditionalButtonsVisible(false);
                    }}
                  >
                    <Image
                      key={index}
                      source={button}
                      style={{
                        width: 50,
                        height: 50,
                        marginTop: 10,
                        marginLeft: 10,
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        //   style={[styles.button, styles.buttonClose]}
        onPress={() => setModalVisible(true)}
      >
        <Icon
          name="mood"
          size={25}
          style={[signatureStyles ? signatureStyles.Textcolor : {}]}
        ></Icon>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start", // 시작 방향에 따라 아이템을 정렬
    marginBottom: 30,
  },
  emotionImage: {
    width: 45,
    height: 45,
    margin: 5, // 여백 추가 (선택 사항)
  },
  container: {
    marginHorizontal: 10,
    padding: 12,
    backgroundColor: "skyblue",
    flexDirection: "row",
    justifyContent: "space-between",

    borderRadius: 20,
  },
  //중앙 배치
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  //모달 스타일링
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    height: "70%",
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
  register: {
    position: "absolute",
    top: "90%",
    width: 70,
    height: 70,
    backgroundColor: "grey",
    borderRadius: 40,
    padding: 20,
  },
  registertext: {
    color: "black",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: "100%",
    right: 10,
    zIndex: 1,
  },
  additionalButtonImage: {
    width: "10%",
    aspectRatio: 1, // 이미지 비율 유지
    backgroundColor: "lightgrey",
    borderRadius: 5,
  },
});
