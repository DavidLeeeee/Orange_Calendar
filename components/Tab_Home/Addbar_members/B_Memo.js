import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Button,
  FlatList,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../../Afirebaseconfig";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

export default function Memo(props) {
  const [modalVisible, setModalVisible] = useState(false); //모달창 Show
  const [showInputModal, setShowInputModal] = useState(false); //inputModal
  const [inputTitle, setInputTitle] = useState("");
  const [inputText, setInputText] = useState("");

  //불러온 메모를 담을 변수.
  const [memoData, setMemoData] = useState([]);

  //각각의 메모 수정
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentMemo, setCurrentMemo] = useState(null);
  const [originalDocName, setOriginalDocName] = useState("");

  const [qualification, setQualification] = useState(false);

  //오늘의 날짜 얻기
  const getToday = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}.${month}.${day}`;
  };

  //---메모 불러오기
  const subscribeToMemos = () => {
    let memoRef;

    if (props.selectedGroup === "My Calendar") {
      const userEmail = firebase.auth().currentUser.email;
      memoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("메모");
    } else {
      memoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("메모");
    }

    // 실시간 동기화를 위한 onSnapshot 사용
    return memoRef.onSnapshot(
      (snapshot) => {
        const memos = [];
        snapshot.forEach((doc) => {
          memos.push({ id: doc.id, ...doc.data() });
        });
        setMemoData(memos);
      },
      (error) => {
        console.error("Error fetching memos:", error);
      }
    );
  };

  //로그인 시 fetchMemos 실행.
  const handleAuthStateChanged = (user) => {
    if (user) {
      const unsubscribe = subscribeToMemos();

      return () => unsubscribe();
    }
  };

  useEffect(() => {
    const unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuthStateChanged);
    return () => unsubscribe();
  }, [isEditModalVisible, props.selectedGroup]);

  //메모를 등록하는 함수.
  const addItem = async () => {
    const today = getToday();
    const docName = `${today}_${inputTitle}`;

    // 데이터베이스에 접근할 경로를 설정
    let targetCollection, targetDoc;
    if (props.selectedGroup === "My Calendar") {
      targetCollection = "users";
      targetDoc = firebase.auth().currentUser.email;
    } else {
      targetCollection = "Group calendar";
      targetDoc = props.selectedGroup;
    }

    try {
      await firebase
        .firestore()
        .collection(targetCollection)
        .doc(targetDoc)
        .collection("메모")
        .doc(docName)
        .set({
          date: today,
          title: inputTitle,
          text: inputText,
        });

      // 직접 상태 업데이트하기
      setMemoData((prevMemos) => [
        ...prevMemos,
        {
          id: docName,
          date: today,
          title: inputTitle,
          text: inputText,
        },
      ]);

      setInputText(""); // 입력 필드 초기화
      setInputTitle(""); // 입력 필드 초기화

      // Optional: 성공 메시지 표시
      Alert.alert("메모가 성공적으로 저장되었습니다!");
    } catch (error) {
      console.error("Error adding document: ", error);
      // 에러 메시지 표시
      Alert.alert(
        "에러",
        "메모를 저장하는 중 문제가 발생했습니다. 다시 시도해 주세요."
      );
    }
  };

  const editItem = async () => {
    const today = getToday();
    const docName = today + "_" + currentMemo.title;
    const userEmail = firebase.auth().currentUser.email;

    if (props.selectedGroup === "My Calendar") {
      const memoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("메모");

      if (originalDocName !== docName) {
        await memoRef.doc(originalDocName).delete(); // 원래 문서 삭제
      }

      await memoRef.doc(docName).set({
        date: today,
        title: currentMemo.title,
        text: currentMemo.text,
      });
    } else {
      const memoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("메모");

      if (originalDocName !== docName) {
        await memoRef.doc(originalDocName).delete(); // 원래 문서 삭제
      }

      await memoRef.doc(docName).set({
        date: today,
        title: currentMemo.title,
        text: currentMemo.text,
      });
    }

    setIsEditModalVisible(false);
  };

  const deleteItem = async () => {
    const today = getToday();
    const docName = today + "_" + currentMemo.title;
    const userEmail = firebase.auth().currentUser.email;

    console.log(docName);

    if (props.selectedGroup === "My Calendar") {
      const memoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("메모");

      if (originalDocName !== docName) {
        await memoRef.doc(originalDocName).delete();
      } else {
        await memoRef.doc(docName).delete();
      }
    } else {
      const memoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("메모");

      if (originalDocName !== docName) {
        await memoRef.doc(originalDocName).delete();
      } else {
        await memoRef.doc(docName).delete();
      }

      const logRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("로그");

      logRef.doc("docName");
    }

    setIsEditModalVisible(false);
  };

  const db = firebase.firestore();
  const currentUser = firebase.auth().currentUser;

  //권한에 따른 접근 권한 제어
  useEffect(() => {
    if (currentUser) {
      getqualification();
      console.log("Memo, 무한 재귀 방지용");
    }
  }, [currentUser, props.selectedGroup]);

  //현재 사용자의 권한 불러오기, 권한에 따른 true/false값 불러오기.
  const getqualification = async () => {
    if (props.selectedGroup !== "My Calendar") {
      const docRef1 = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .doc(currentUser.email)
        .get();

      const powerdata = docRef1.data().power;
      console.log("Memo, ", powerdata);

      const docRef2 = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .doc(powerdata)
        .get();

      const qualificationdata = docRef2.data().Memo;
      setQualification(qualificationdata);
      console.log("메모 권한: ", qualification);
    }
  };

  const registerLog = async () => {
    const today = getToday();

    const currentUser = firebase.auth().currentUser;

    const userRef = db.collection("users").doc(currentUser.email).get();

    const currentUserName = (await userRef).data().UserName;

    if (props.selectedGroup !== "My Calendar") {
      db.collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("로그")
        .doc("메모: " + today + "_" + currentUserName + "_" + inputTitle) //날짜_작성자_일정내용
        .set({
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          name: currentUserName,
          content: "메모: " + inputTitle,
          date: today,
        });
    }
  };

  // 메모의 개수를 확인
  const memoCount = [...memoData].length;

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  return (
    <View>
      {/* 가장 바깥의 모달 */}
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
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Icon name="arrow-back" size={25} />
              </TouchableOpacity>
              <Text style={styles.modalText}>메모</Text>
              <View style={{ width: 30 }}></View>
            </View>
            {/* 각각의 메모 렌더링 */}
            <FlatList
              key={memoCount} // key 속성을 메모의 개수에 따라 변경
              numColumns={memoCount > 1 ? 2 : 1}
              data={[...memoData].reverse()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.memoLoadBox,
                    memoCount === 1 && { width: 120 },
                  ]}
                  onPress={() => {
                    setCurrentMemo(item);
                    setOriginalDocName(item.date + "_" + item.title);
                    setIsEditModalVisible(true);
                  }}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.memoTitle}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.customUnderline} />
                  <Text
                    numberOfLines={5}
                    ellipsizeMode="tail"
                    style={styles.memoText}
                  >
                    {item.text}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "flex-end",
                      alignItems: "flex-end",
                    }}
                  >
                    <Text style={styles.dateText}>
                      updated at _ {item?.date}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* 메모 생성 버튼 */}
            <TouchableOpacity
              style={{ marginTop: "auto", marginRight: "auto" }}
              onPress={() => setShowInputModal(!showInputModal)} // 여기에 onPress 이벤트를 추가
            >
              <Image
                source={require("../../../assets/Post.png")}
                style={{ width: 40, height: 40 }}
              />
            </TouchableOpacity>

            {/* << 내부 모델 >>메모를 생성하도록 하는 모달창 */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={showInputModal}
              onRequestClose={() => {
                setShowInputModal(false);
              }}
            >
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: "50%",
                      height: 400,
                      backgroundColor: "rgba(255, 243, 130, 0.9)",
                      alignItems: "center",
                      padding: 10,
                    }}
                  >
                    {/* 모든 내용은 이 안에 들어가야 합니다. */}
                    {/* 텍스트 입력 */}
                    <TextInput
                      style={styles.memotitleinput}
                      placeholder="title"
                      placeholderTextColor={"lightgrey"}
                      onChangeText={(text) => setInputTitle(text)}
                      value={inputTitle}
                      multiline={true}
                      numberOfLines={2}
                    />
                    <TextInput
                      style={styles.memotextinput}
                      placeholder="text here"
                      placeholderTextColor={"lightgrey"}
                      onChangeText={(text) => setInputText(text)}
                      value={inputText}
                      multiline={true}
                    />
                    {/* 작은 모달 안의 "폴더 생성" 버튼 */}
                    <TouchableOpacity
                      style={styles.memogenerator}
                      onPress={() => {
                        addItem();
                        registerLog();
                        setShowInputModal(false);
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "500",
                          color: "rgba(0,0,0,0.4)",
                        }}
                      >
                        SAVE
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.closeButton2}
                      onPress={() => {
                        setInputTitle(""); // 제목 입력 필드 초기화
                        setInputText(""); // 텍스트 입력 필드 초기화
                        setShowInputModal(false); // 모달 창 닫기
                      }}
                    >
                      <Icon name="close" size={28} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
            {/* 모달 수정하기 */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={isEditModalVisible}
              onRequestClose={() => {
                setIsEditModalVisible(false);
              }}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView2}>
                  {/* 여기에 수정을 위한 입력 필드 및 버튼을 추가 */}
                  <TextInput
                    style={styles.memoTitleForEdit}
                    // numberOfLines={2}
                    value={currentMemo?.title}
                    onChangeText={(text) =>
                      setCurrentMemo((prev) => ({ ...prev, title: text }))
                    }
                    multiline={true}
                  />

                  <TextInput
                    style={styles.memoTextForEdit}
                    value={currentMemo?.text}
                    numberOfLines={5}
                    onChangeText={(text) =>
                      setCurrentMemo((prev) => ({ ...prev, text: text }))
                    }
                    multiline={true}
                  />
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      marginTop: 4,
                    }}
                  >
                    <TouchableOpacity onPress={async () => deleteItem()}>
                      <Icon name="delete" size={22} color="rgba(255,80,80,1)" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={async () => editItem()}>
                      <Icon name="save" size={24} color="rgba(80,130,255,1)" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setIsEditModalVisible(false)}
                    >
                      <Icon name="close" size={24} color="black" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </Modal>

      {/* 모달 진입 버튼 */}
      <TouchableOpacity
        //   style={[styles.button, styles.buttonClose]}
        onPress={() => {
          if (props.selectedGroup === "My Calendar") {
            setModalVisible(!modalVisible);
          } else {
            setModalVisible(qualification);
            if (qualification === false) {
              Alert.alert("권한 알림", "메모에 대한 권한이 없습니다.");
            }
          }
        }}
      >
        <Icon
          name="mode-edit"
          size={25}
          style={[signatureStyles ? signatureStyles.Textcolor : {}]}
        ></Icon>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  space: {
    flexDirection: "row",
    justifyContent: "space-between",
    //alignItems: "center",
    margin: 10,
  },
  pickRepeat: {
    flex: 1,
    backgroundColor: "white",
    margin: 5,
    borderRadius: 5,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  //모달창
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
  modalView2: {
    margin: 20,
    backgroundColor: "rgba(255, 243, 130, 0.9)",
    borderRadius: 0,
    width: "50%",
    height: "35%",
    padding: 20,
    paddingBottom: 5,
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
  //모달 타이틀
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
  //(내부 모달)반복일자 폴더 생성 모달창

  inputModal: {
    paddingHorizontal: 10, // 좌우로 20의 패딩 값 추가
    flexDirection: "column",
    alignItems: "center", // 수평 방향 중앙 정렬
    justifyContent: "center",
    width: "100%",
    height: "70%",
    backgroundColor: "rgba(100, 160, 250, 0.4)", // 배경 색상과 투명도 설정
    borderRadius: 10,
    // iOS 그림자 스타일
    shadowColor: "#000", // 그림자의 색상
    shadowOffset: {
      width: 0, // 그림자의 너비 방향 크기
      height: 2, // 그림자의 높이 방향 크기
    },
    shadowOpacity: 0.23, // 그림자의 투명도
    shadowRadius: 2.62, // 그림자의 반경

    // Android 그림자 스타일
    elevation: 4,
  },
  //메모 작성하기
  memotitleinput: {
    width: "90%",
    height: "10%",
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderColor: "rgba(200, 190, 80, 1)",
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 5,
    fontWeight: "600",
    fontSize: 15,
    paddingHorizontal: 8,
  },
  memotextinput: {
    width: "90%",
    height: "70%",
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderColor: "rgba(200, 190, 80, 1)",
    borderWidth: 1,
    marginBottom: 5,
    paddingHorizontal: 8,
  },
  memogenerator: {
    alignItems: "center",
    justifyContent: "center",
    width: 60,
    height: 30,
    backgroundColor: "rgba(250, 200, 120, 0.2)",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(0,0,0,0.4)",
    margin: 8,
  },
  // 로딩하는 메모
  memoLoadBox: {
    width: "40%",
    height: 140, // 높이를 130으로 변경
    margin: 15,
    marginBottom: 15,
    backgroundColor: "rgba(255, 243, 130, 0.9)",
    padding: 10, // 안쪽 패딩 추가
    paddingBottom: 0,
  },
  memoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 0, // 제목 아래 여백 추가
    height: 20,
  },
  memoTitleForEdit: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 0, // 제목 아래 여백 추가
    height: 32,
    backgroundColor: "rgba(250,250,250,0.7)",
    width: "100%",
  },
  customUnderline: {
    height: 1,
    backgroundColor: "rgba(235, 213, 100, 0.9)", // 밑줄 색상
    marginBottom: 5, // underline 아래 여백 추가
  },
  memoText: {
    flex: 1, // 남은 공간을 모두 차지하도록 설정
    fontSize: 13,
  },
  memoTextForEdit: {
    flex: 1, // 남은 공간을 모두 차지하도록 설정
    marginTop: 5,
    width: "100%",
    backgroundColor: "rgba(250,250,250,0.7)",
  },

  //모달 닫기 버튼
  closeButton: {
    position: "absolute",
    top: "100%",
    right: 10,
    zIndex: 2,
  },
  closeButton2: {
    position: "absolute",
    top: "1%",
    right: 5,
    zIndex: 2,
  },
  closeRepeatButton: {
    position: "absolute",
    top: "100%",
    right: 10,
    zIndex: 1,
  },
  dateText: {
    // position: "absolute",
    // right: 0,
    // bottom: 0,
    padding: 1,
    fontSize: 8,
    alignSelf: "flex-end", // 오른쪽 정렬
  },
});
