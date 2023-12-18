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
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../../Afirebaseconfig";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

export default function Repeat(props) {
  const [keyboardOffset, setKeyboardOffset] = useState(0); //키보드 유무에 따른 변화
  const [modalVisible, setModalVisible] = useState(false); //모달창 Show
  const [inputText, setInputText] = useState("");
  const [items, setItems] = useState([]);
  const [showInputModal, setShowInputModal] = useState(false); //inputModal
  //각각의 폴더를 관리
  const [showFolderModal, setShowFolderModal] = useState(false); //folderModal
  const [selectedItem, setSelectedItem] = useState(null);
  //반복일정 실1제 생성
  const [selectedValue, setSelectedValue] = useState("yearly");
  const [selectedMonth, setSelectedMonth] = useState("01");
  const [selectedDay, setSelectedDay] = useState("01");
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );
  const [textInputValue, setTextInputValue] = useState("");
  //반복일정 불러오기
  const [dataList, setDataList] = useState([]);
  //컬러팔레트
  const COLORS = [
    "rgba(255, 80, 80, 0.9)",
    "rgba(255, 192, 203, 0.9)",
    "rgba(255, 165, 0, 0.9)",
    "rgba(255, 255, 100, 0.9)",
    "rgba(50, 255, 50, 0.9)",
    "rgba(46, 204, 113, 0.9)",
    "rgba(0, 255, 255, 0.9)",
    "rgba(80, 80, 255, 0.9)",
    "rgba(168, 80, 168, 0.9)",
  ]; // 다양한 색상을 추가합니다.
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [selectedColor, setSelectedColor] = useState("rgba(200, 200, 200, 1)"); // 기본 색상 설정

  //폴더명 불러오기
  const fetchFolderNames = async () => {
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      try {
        let collectionRef;

        if (props.selectedGroup === "My Calendar") {
          const userEmail = firebase.auth().currentUser.email;
          collectionRef = firebase
            .firestore()
            .collection("users")
            .doc(userEmail)
            .collection("반복일정폴더");
        } else {
          collectionRef = firebase
            .firestore()
            .collection("Group calendar")
            .doc(props.selectedGroup)
            .collection("반복일정폴더");
        }

        const snapshot = await collectionRef.get();

        const folderNames = [];
        snapshot.forEach((doc) => {
          folderNames.push(doc.id); // 문서 ID는 폴더명과 동일하다고 가정합니다.
        });

        setItems(folderNames);
      } catch (error) {
        console.error("Error fetching folder names:", error);
      }
    }
  };

  // 모달 내에서 아이템을 추가하는 함수
  const addItem = async () => {
    if (inputText) {
      try {
        let docRef;

        if (props.selectedGroup === "My Calendar") {
          // 'My Calendar'를 사용할 때의 로직
          docRef = firebase
            .firestore()
            .collection("users")
            .doc(firebase.auth().currentUser.email)
            .collection("반복일정폴더")
            .doc(inputText);
        } else {
          // 'Group calendar'를 사용할 때의 로직
          docRef = firebase
            .firestore()
            .collection("Group calendar")
            .doc(props.selectedGroup)
            .collection("반복일정폴더")
            .doc(inputText);
        }

        await docRef.set({
          text: inputText,
        });

        // 직접 상태를 업데이트하여 폴더를 추가
        setItems((prevItems) => [...prevItems, inputText]);
        setInputText(""); // 입력 필드 초기화
      } catch (error) {
        console.error("Error adding item: ", error);
      }
    }
  };

  //반복일자 폴더명 가져오기
  const fetchData = async () => {
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      try {
        // 데이터를 불러오기 전에 기존 목록 초기화
        setDataList([]);

        const ref =
          props.selectedGroup === "My Calendar"
            ? firebase
                .firestore()
                .collection(`users`)
                .doc(firebase.auth().currentUser.email)
            : firebase
                .firestore()
                .collection(`Group calendar`)
                .doc(props.selectedGroup);

        const yearlyRef = ref
          .collection(`반복일정`)
          .doc("yearly")
          .collection(selectedItem);
        const monthlyRef = ref
          .collection(`반복일정`)
          .doc("monthly")
          .collection(selectedItem);

        const yearlySnapshot = await yearlyRef.get();
        const monthlySnapshot = await monthlyRef.get();

        const fetchedData = [];

        yearlySnapshot.forEach((doc) => {
          fetchedData.push({
            id: doc.id,
            ...doc.data(),
            repeatType: "yearly",
          });
        });

        monthlySnapshot.forEach((doc) => {
          fetchedData.push({
            id: doc.id,
            ...doc.data(),
            repeatType: "monthly",
          });
        });

        if (fetchedData.length === 0) {
          console.log(`${selectedItem} 폴더에 반복일정이 없습니다.`);
        } else {
          setDataList(fetchedData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    }
  };

  //반복 일정 등록하기
  const saveDataToFirestore = async () => {
    const currentUser = firebase.auth().currentUser;
    let docName = "";
    if (currentUser) {
      try {
        if (props.selectedGroup === "My Calendar") {
          // 현재 사용자 이메일 가져오기
          const userEmail = firebase.auth().currentUser.email;

          // Firestore 경로 설정
          const docPath = `users/${userEmail}/반복일정/${selectedValue}/${selectedItem}`;

          // 문서 이름 설정 (날짜와 텍스트 입력 기반)
          let docName = "";
          if (selectedValue === "yearly") {
            docName = `${selectedMonth}-${selectedDay}_${textInputValue}`;
          } else {
            docName = `${selectedDay}_${textInputValue}`;
          }

          // 데이터 저장
          await firebase
            .firestore()
            .collection(docPath)
            .doc(docName)
            .set({
              date:
                selectedValue === "yearly"
                  ? `${selectedMonth}-${selectedDay}`
                  : selectedDay,
              text: textInputValue,
            });

          alert("데이터가 성공적으로 저장되었습니다!");
        } else {
          const docPath = `Group calendar/${props.selectedGroup}/반복일정/${selectedValue}/${selectedItem}`;

          if (selectedValue === "yearly") {
            docName = `${selectedMonth}-${selectedDay}_${textInputValue}`;
          } else {
            docName = `${selectedDay}_${textInputValue}`;
          }

          // 데이터 저장
          await firebase
            .firestore()
            .collection(docPath)
            .doc(docName)
            .set({
              date:
                selectedValue === "yearly"
                  ? `${selectedMonth}-${selectedDay}`
                  : selectedDay,
              text: textInputValue,
            });

          alert("데이터가 성공적으로 저장되었습니다!");
        }
      } catch (error) {
        console.error(
          "Firestore에 데이터를 저장하는 중 오류가 발생했습니다:",
          error
        );
        alert("데이터 저장에 실패했습니다. 다시 시도해 주세요.");
      }
    }
    const newData = {
      id: docName,
      date:
        selectedValue === "yearly"
          ? `${selectedMonth}-${selectedDay}`
          : selectedDay,
      text: textInputValue,
      repeatType: selectedValue,
    };
    // TextInput 초기화
    setTextInputValue("");
    setDataList((prevData) => [...prevData, newData]);
  };

  useEffect(() => {
    if (selectedItem) {
      // selectedItem이 있을 때만 fetchData 호출
      fetchData();
    }
  }, [selectedItem]);

  //반복일정 삭제하기
  const deleteItemFromFirestore = async (item) => {
    try {
      if (props.selectedGroup === "My Calendar") {
        const userEmail = firebase.auth().currentUser.email;
        const documentId = `${item.date}_${item.text}`; // 문서 ID 생성

        // Firestore 경로를 정확하게 참조합니다.
        const ref = firebase
          .firestore()
          .collection(`users`)
          .doc(userEmail)
          .collection(`반복일정`)
          .doc(selectedValue)
          .collection(selectedItem)
          .doc(documentId);

        // 문서를 삭제합니다.
        await ref.delete();
        console.log(documentId);

        // 로컬 상태 업데이트
        setDataList((prevDataList) =>
          prevDataList.filter((dataItem) => dataItem.id !== documentId)
        );
      } else {
        const documentId = `${item.date}_${item.text}`; // 문서 ID 생성

        // Firestore 경로를 정확하게 참조합니다.
        const ref = firebase
          .firestore()
          .collection(`Group calendar`)
          .doc(props.selectedGroup)
          .collection(`반복일정`)
          .doc(selectedValue)
          .collection(selectedItem)
          .doc(documentId);

        // 문서를 삭제합니다.
        await ref.delete();

        // 로컬 상태 업데이트
        setDataList((prevDataList) =>
          prevDataList.filter((dataItem) => {
            dataItem.id !== documentId;
          })
        );
      }
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  //반복일정 시그니쳐색상 설정하기
  // 각 폴더별 시그니쳐 색상 보여주기

  // !!0916, 컬렉션 생성 이전일 경우 고려하에 수정. 기능이 제대로 작동 안할 수 있음.
  useEffect(() => {
    const fetchColorFromFirestore = async () => {
      const currentUser = firebase.auth().currentUser;

      if (!currentUser) {
        return;
      }

      try {
        const userEmail = currentUser.email;
        const docRef = firebase.firestore().collection("users").doc(userEmail);

        if (props.selectedGroup === "My Calendar") {
          const calendarRef = await docRef
            .collection(`반복일정폴더`)
            .doc(selectedItem)
            .get();

          if (calendarRef.exists) {
            const fetchedColor = calendarRef.data().color;
            if (fetchedColor) {
              setSelectedColor(fetchedColor);
            }
          } else {
            console.log("No such document!");
          }
        } else {
          const groupDocRef = firebase
            .firestore()
            .collection("Group calendar")
            .doc(props.selectedGroup);
          const calendarRef = await groupDocRef
            .collection(`반복일정폴더`)
            .doc(selectedItem)
            .get();

          if (calendarRef.exists) {
            const fetchedColor = calendarRef.data().color;
            if (fetchedColor) {
              setSelectedColor(fetchedColor);
            }
          } else {
            console.log("No such document!");
          }
        }
      } catch (error) {
        console.error("Error fetching color from Firestore:", error);
      }
    };

    if (selectedItem && props.selectedGroup) {
      fetchColorFromFirestore();
    }
  }, [selectedItem, props.selectedGroup]); // selectedItem 값이 변경될 때마다 실행

  // 색상 값을 Firestore에 저장하는 함수
  const saveColorToFirestore = async (color) => {
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      try {
        if (props.selectedGroup === "My Calendar") {
          const userEmail = firebase.auth().currentUser.email;
          await firebase
            .firestore()
            .collection("users")
            .doc(userEmail)
            .collection("반복일정폴더")
            .doc(selectedItem)
            .set(
              {
                color: color,
              },
              { merge: true }
            ); // merge 옵션을 사용하면 이미 존재하는 문서에 필드를 추가/업데이트하고, 없는 경우 문서를 생성합니다.

          console.log(`Saved color: ${color} for ${selectedItem}`);
        } else {
          const userEmail = firebase.auth().currentUser.email;
          await firebase
            .firestore()
            .collection("Group calendar")
            .doc(props.selectedGroup)
            .collection("반복일정폴더")
            .doc(selectedItem)
            .set(
              {
                color: color,
              },
              { merge: true }
            ); // merge 옵션을 사용하면 이미 존재하는 문서에 필드를 추가/업데이트하고, 없는 경우 문서를 생성합니다.

          console.log(`Saved color: ${color} for ${selectedItem}`);
        }
      } catch (error) {
        console.error("Error saving color to Firestore:", error);
      }
    }
  };

  const [qualification, setQualification] = useState(false);
  const currentUser = firebase.auth().currentUser;

  useEffect(() => {
    if (currentUser) {
      getqualification();
    }
  }, [currentUser, props.selectedGroup]);

  const getqualification = async () => {
    if (props.selectedGroup !== "My Calendar") {
      const docRef1 = await firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .doc(currentUser.email)
        .get();

      const powerdata = docRef1.data().power;
      console.log("Repeat, ", powerdata);

      const docRef2 = await firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .doc(powerdata)
        .get();

      const qualificationdata = docRef2.data().Repeat;
      setQualification(qualificationdata);
      console.log("반복 일정 권한: ", qualification);
    }
  };

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
                onPress={() => {
                  setModalVisible(!modalVisible);
                  setTextInputValue(""); // TextInput 초기화
                }}
              >
                <Icon name="arrow-back" size={25} color="black" />
              </TouchableOpacity>

              <Text style={styles.modalText}>반복 일정</Text>
              <View style={{ width: 20 }}></View>
            </View>
            {/* 각각의 폴더 렌더링 */}
            <FlatList
              data={items}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => {
                    setSelectedItem(item);
                    setShowFolderModal(true);
                  }}
                  onLongPress={() => {
                    Alert.alert(
                      "삭제 확인", // Alert 제목
                      `${item}을(를) 삭제하시겠습니까?`, // Alert 메시지
                      [
                        {
                          text: "취소",
                          onPress: () => console.log("삭제 취소"), // 취소 버튼을 눌렀을 때의 동작
                          style: "cancel",
                        },
                        {
                          text: "삭제",
                          onPress: async () => {
                            try {
                              // Firestore 참조 설정
                              const userRef =
                                props.selectedGroup === "My Calendar"
                                  ? firebase
                                      .firestore()
                                      .collection("users")
                                      .doc(firebase.auth().currentUser.email)
                                  : firebase
                                      .firestore()
                                      .collection("Group calendar")
                                      .doc(props.selectedGroup);

                              // '반복일정폴더' 문서 삭제
                              await userRef
                                .collection("반복일정폴더")
                                .doc(item)
                                .delete();

                              // 'yearly' 컬렉션의 모든 문서 삭제
                              const yearlySnapshot = await userRef
                                .collection("반복일정")
                                .doc("yearly")
                                .collection(item)
                                .get();
                              yearlySnapshot.forEach((doc) => {
                                doc.ref.delete();
                              });

                              // 'monthly' 컬렉션의 모든 문서 삭제
                              const monthlySnapshot = await userRef
                                .collection("반복일정")
                                .doc("monthly")
                                .collection(item)
                                .get();
                              monthlySnapshot.forEach((doc) => {
                                doc.ref.delete();
                              });
                              // FlatList에서 아이템 삭제 후 상태 업데이트
                              setItems((prevItems) =>
                                prevItems.filter(
                                  (prevItem) => prevItem !== item
                                )
                              );
                              console.log(`${item} 삭제 완료`);
                            } catch (error) {
                              console.error("삭제 중 오류 발생: ", error);
                            }
                          },
                        },
                      ],
                      { cancelable: false }
                    );
                  }}
                >
                  <Image
                    source={require("../../../assets/folder.png")}
                    style={{ width: 100, height: 100 }}
                  />
                  <Text style={styles.itemText}>{item}</Text>
                </TouchableOpacity>
              )}
              numColumns={3} // 가로로 3개의 열로 표시
              keyExtractor={(item, index) => index.toString()} // 고유한 키 설정
            />

            {/* 폴더 생성 버튼 */}
            <TouchableOpacity
              style={{ marginTop: "auto", marginRight: "auto" }}
              onPress={() => setShowInputModal(!showInputModal)} // 여기에 onPress 이벤트를 추가
            >
              <Image
                source={require("../../../assets/AddFolder.png")}
                style={{ width: 50, height: 50 }}
              />
            </TouchableOpacity>

            {/* 폴더를 생성하도록 하는 모달창 */}
            <Modal
              animationType="fade"
              transparent={true} // 수정: true로 변경하여 배경을 투명하게 만듭니다.
              visible={showInputModal}
              onRequestClose={() => {
                setShowInputModal(false);
              }}
            >
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={1}
                onPressOut={() => {
                  setInputText(""); // 입력 필드 초기화
                  setShowInputModal(false); // 모달 창 닫기
                }} // 여기에서 모달 외부를 탭하면 모달을 닫습니다.
              >
                <View style={styles.inputModal}>
                  {/* 텍스트 입력 */}
                  <TextInput
                    style={styles.foldernameinput}
                    placeholder="name here.."
                    placeholderTextColor={"rgba(0,0,0,0.5)"}
                    onChangeText={(text) => setInputText(text)}
                    value={inputText}
                  />
                  {/* 작은 모달 안의 "폴더 생성" 버튼 */}
                  <TouchableOpacity
                    style={styles.foldergenerator}
                    onPress={() => {
                      addItem(); // 아이템을 추가
                      setShowInputModal(false); // 모달을 닫음
                      setInputText(""); // 입력 필드 초기화
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "500",
                        color: "white",
                      }}
                    >
                      ADD
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>

            {/* 각각의 폴더 모달 */}
            <Modal
              animationType="none"
              transparent={true}
              visible={showFolderModal}
              onRequestClose={() => {
                setShowFolderModal(false);
              }}
            >
              <View style={styles.centeredView}>
                <View style={styles.modalView}>
                  <Text style={styles.modalText}>
                    현재 폴더: {selectedItem}
                  </Text>
                  {/* 닫기버튼 */}
                  <TouchableOpacity
                    style={styles.closeFolderButton}
                    onPress={() => setShowFolderModal(false)}
                  >
                    <Icon name="west" size={25} color="black" />
                  </TouchableOpacity>
                  {/* 이 부분에 컬러팔레트를 만들어줘 */}
                  <TouchableOpacity
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: selectedColor,
                      borderWidth: 1,
                      borderColor: "black",
                    }}
                    onPress={() => setShowColorPalette((prev) => !prev)}
                  />
                  {/* // 드롭다운 컬러 팔레트 */}
                  {showColorPalette && (
                    <View
                      style={{
                        position: "absolute",
                        top: 40, // 예시: 버튼 바로 아래에 위치하게 하기 위한 값 (조정 필요)
                        right: "38%", // 예시: 왼쪽 정렬 (조정 필요)
                        zIndex: 1, // 다른 요소 위에 나타나게 함
                        flexDirection: "column",
                        backgroundColor: "rgba(120,120,120,0.1)",
                        marginTop: 10,
                      }}
                    >
                      {COLORS.map((color) => (
                        <TouchableOpacity
                          key={color}
                          style={{
                            width: 30,
                            height: 30,
                            backgroundColor: color,
                            margin: 5,
                          }}
                          onPress={() => {
                            setSelectedColor(color); // 로컬 상태 업데이트
                            setShowColorPalette(false); // 드롭다운 닫기
                            saveColorToFirestore(color); // Firestore에 색상 저장
                          }}
                        />
                      ))}
                    </View>
                  )}

                  {/* 일정 생성자 */}
                  <View style={{ padding: 5, width: "100%", maxHeight: "90%" }}>
                    {Platform.OS === "ios" ? (
                      <View
                        style={{
                          flexDirection: "row",
                          height: "8%",
                          backgroundColor: "white",
                        }}
                      >
                        {/* 반복주기 픽 */}
                        <Picker
                          selectedValue={selectedValue}
                          style={styles.pickRepeat}
                          itemStyle={{
                            fontSize: 14,
                            width: "100%",
                            height: "100%",
                          }} // 폰트 크기 조절
                          onValueChange={(itemValue, itemIndex) =>
                            setSelectedValue(itemValue)
                          }
                        >
                          <Picker.Item label="연간" value="yearly" />
                          <Picker.Item label="월간" value="monthly" />
                        </Picker>
                        {/* 연간일 때 월 선택 */}
                        {selectedValue === "yearly" && (
                          <Picker
                            selectedValue={selectedMonth}
                            style={styles.pickmonth}
                            itemStyle={{ fontSize: 14, height: "100%" }}
                            onValueChange={(itemValue) =>
                              setSelectedMonth(itemValue)
                            }
                          >
                            {Array.from({ length: 12 }, (_, i) =>
                              (i + 1).toString().padStart(2, "0")
                            ).map((month) => (
                              <Picker.Item
                                key={month}
                                label={month}
                                value={month}
                              />
                            ))}
                          </Picker>
                        )}

                        {/* 일 선택 */}
                        <Picker
                          selectedValue={selectedDay}
                          style={styles.pickmonth}
                          itemStyle={{ fontSize: 14, height: "100%" }}
                          onValueChange={(itemValue) =>
                            setSelectedDay(itemValue)
                          }
                        >
                          {days.map((day) => (
                            <Picker.Item key={day} label={day} value={day} />
                          ))}
                        </Picker>
                      </View>
                    ) : (
                      <View
                        style={{
                          flexDirection: "row",
                          alignSelf: "center",
                          width: "115%",
                          height: "15%",
                        }}
                      >
                        {/* 반복주기 픽 */}
                        <Picker
                          selectedValue={selectedValue}
                          style={styles.pickRepeat}
                          itemStyle={{
                            fontSize: 10,
                          }} // 폰트 크기 조절
                          onValueChange={(itemValue, itemIndex) =>
                            setSelectedValue(itemValue)
                          }
                        >
                          <Picker.Item label="연간" value="yearly" />
                          <Picker.Item label="월간" value="monthly" />
                        </Picker>
                        {/* 연간일 때 월 선택 */}
                        {selectedValue === "yearly" && (
                          <Picker
                            selectedValue={selectedMonth}
                            style={styles.pickmonth}
                            itemStyle={{ fontSize: 14 }}
                            onValueChange={(itemValue) =>
                              setSelectedMonth(itemValue)
                            }
                          >
                            {Array.from({ length: 12 }, (_, i) =>
                              (i + 1).toString().padStart(2, "0")
                            ).map((month) => (
                              <Picker.Item
                                key={month}
                                label={month}
                                value={month}
                              />
                            ))}
                          </Picker>
                        )}

                        {/* 일 선택 */}
                        <Picker
                          selectedValue={selectedDay}
                          style={styles.pickmonth}
                          itemStyle={{ fontSize: 14 }}
                          onValueChange={(itemValue) =>
                            setSelectedDay(itemValue)
                          }
                        >
                          {days.map((day) => (
                            <Picker.Item key={day} label={day} value={day} />
                          ))}
                        </Picker>
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        marginTop: 1,
                        alignItems: "center",
                      }}
                    >
                      <TextInput
                        style={{
                          flex: 1,
                          borderWidth: 0.5,
                          borderColor: "black",
                          marginRight: 10,
                          padding: 5,
                        }}
                        placeholder="텍스트를 입력하세요."
                        onChangeText={setTextInputValue}
                        value={textInputValue}
                      />
                      <TouchableOpacity
                        style={{
                          backgroundColor: "rgb(0,123,255))",
                          padding: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                        }}
                        onPress={saveDataToFirestore}
                      >
                        <Text
                          style={{
                            color: "white",
                            fontSize: 15,
                            fontWeight: "600",
                            shadowColor: "black",
                            shadowOffset: { width: 1, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 1,
                          }}
                        >
                          추가
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <FlatList
                      style={{ marginTop: 10, width: "100%", height: "100%" }}
                      data={dataList}
                      renderItem={({ item }) => (
                        <View
                          style={{
                            height: 40,
                            padding: 0,
                            borderBottomWidth: 1,
                            borderBottomColor: "#ddd",
                            flexDirection: "row", // 가로로 배열하기 위한 스타일
                            alignItems: "center", // 아이템들을 세로 중앙에 배치
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 10,
                              position: "absolute",
                              top: 0,
                              left: 0,
                            }}
                          >
                            {item.repeatType}
                          </Text>

                          <View
                            style={{
                              flexDirection: "row",
                              flexGrow: 1,
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <Text style={{ width: 100 }}>{item.date}</Text>
                              <Text style={{ width: 100 }}>{item.text}</Text>
                            </View>

                            <TouchableOpacity
                              onPress={() => deleteItemFromFirestore(item)}
                              style={{
                                backgroundColor: "rgb(255,99,132)",
                                padding: 8,
                                borderRadius: 8,
                              }}
                            >
                              <Text style={{ color: "white", fontSize: 12 }}>
                                삭제
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      keyExtractor={(item) => `${item.date}_${item.text}`}
                    />
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
            setModalVisible(true);
            fetchFolderNames();
          } else {
            setModalVisible(qualification);
            if (qualification === false) {
              Alert.alert("권한 알림", "반복 일정에 대한 권한이 없습니다.");
            } else {
              fetchFolderNames();
            }
          }
        }}
      >
        <Icon
          name="autorenew"
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
  pickmonth: {
    flex: 1,
    margin: 5,
    borderRadius: 5,
  },
  pickRepeat: {
    flex: 1,
    backgroundColor: "white",
    margin: 0,
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
  //모달 타이틀
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
  //폴더 (배치및 텍스트)
  item: {
    alignItems: "center", // 아이템 내부의 컨텐츠를 중앙 정렬
    justifyContent: "center", // 세로 방향으로도 중앙 정렬
    padding: 10, // 각 아이템 주위에 패딩 추가
  },
  itemText: {
    top: "-15%",
    marginBottom: "0%", // 텍스트를 좀 더 위쪽에 위치시킵니다.
    fontSize: 14, // 글자 크기를 키웁니다.
    // 원하는 다른 스타일을 추가로 설정할 수 있습니다.
  },
  //(내부 모달)반복일자 폴더 생성 모달창
  inputModal: {
    paddingHorizontal: 10, // 좌우로 20의 패딩 값 추가
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between", // 수직 방향 중앙 정렬
    alignItems: "center", // 수평 방향 중앙 정렬
    width: 180,
    height: 45,
    top: "60%",
    left: "10%",
    backgroundColor: "rgba(100, 160, 250, 1)", // 배경 색상과 투명도 설정
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
  foldernameinput: {
    width: "70%",
    height: "70%",
    backgroundColor: "white",
    borderColor: "rgba(100, 160, 250, 0.4)",
    borderWidth: 1,
    paddingLeft: 4,
  },
  foldergenerator: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 30,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "white",
  },

  //반복일자 등록버튼
  setrepeatwindow: {
    justifyContent: "center", // 수직 방향 중앙 정렬
    alignItems: "center", // 수평 방향 중앙 정렬
    width: "50%",
    height: "50%",
    top: "20%",
    left: "20%",
    backgroundColor: "rgba(100, 160, 250, 0.4)", // 배경 색상과 투명도 설정
    borderRadius: 10,
    zIndex: 1,
  },
  //모달 닫기 버튼
  closeButton: {
    position: "absolute",
    top: "100%",
    right: 10,
    zIndex: 2,
  },
  closeRepeatButton: {
    position: "absolute",
    top: "100%",
    right: 10,
    zIndex: 1,
  },
  //폴더 닫기 버튼
  closeFolderButton: {
    position: "absolute",
    top: "5%",
    left: 10,
    zIndex: 2,
  },
});
