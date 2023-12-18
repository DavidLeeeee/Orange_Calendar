import React, { useState, useEffect } from "react";
import { firebase } from "../../../../Afirebaseconfig";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DeleteModal from "./Delete_Modal";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3;
//해당 달의 모든 문서를 검색하므로 최적화가 필요할 수 있습니다.
//가능하다면 문서의 ID 구성 방식을 변경하여 Firestore 쿼리의 효율성을 높이는 것이 좋습니다.
export default function MemoComponent({
  title,
  widgets,
  setWidgets,
  selectedGroup,
}) {
  const [memo, setMemo] = useState(null); // 찾은 메모를 저장할 상태
  const userEmail = firebase.auth().currentUser.email;

  useEffect(() => {
    const fetchMemoByTitle = async () => {
      console.log({ title }, `메모 위젯 렌더링`);
      try {
        let memosRef;

        if (selectedGroup === "My Calendar") {
          memosRef = firebase
            .firestore()
            .collection("users")
            .doc(userEmail)
            .collection("메모");
        } else {
          memosRef = firebase
            .firestore()
            .collection("Group calendar")
            .doc(selectedGroup)
            .collection("메모");
        }

        // 실시간으로 데이터를 동기화하기 위해 onSnapshot 메서드 사용
        const unsubscribe = memosRef.onSnapshot(
          (snapshot) => {
            snapshot.forEach((doc) => {
              const docId = doc.id;
              // Check if the document ID ends with the specified title
              if (docId.endsWith(`_${title}`)) {
                // Found a matching document, set it in the state
                setMemo(doc.data());
              }
            });
          },
          (error) => {
            console.error(
              "메모를 실시간으로 가져오는 중 오류가 발생했습니다:",
              error
            );
          }
        );

        // 필요한 경우, 리스너를 해제할 수 있습니다.
        // 예를 들어, 컴포넌트가 언마운트될 때 unsubscribe 함수를 호출합니다.
        return unsubscribe;
      } catch (error) {
        console.error(
          "메모를 실시간으로 설정하는 중 오류가 발생했습니다:",
          error
        );
      }
    };

    fetchMemoByTitle();
  }, [title, selectedGroup]);

  //순서 업데이트
  const onDelete_list_update = async () => {
    try {
      const widgetsRef =
        selectedGroup === "My Calendar"
          ? firebase
              .firestore()
              .collection("users")
              .doc(userEmail)
              .collection("위젯")
          : firebase
              .firestore()
              .collection("Group calendar")
              .doc(selectedGroup)
              .collection("위젯");

      const allDocs = await widgetsRef.get();
      const docNames = allDocs.docs.map((doc) => doc.id);

      console.log("Original Document names in 위젯 collection:", docNames);

      const batch = firebase.firestore().batch(); // batch 생성

      let counter = 1;
      for (let docName of docNames) {
        const parts = docName.split("_");
        const newDocId = `${counter}_${parts[1]}`;

        if (docName !== newDocId) {
          const oldDocRef = widgetsRef.doc(docName);
          const newDocRef = widgetsRef.doc(newDocId);
          const docData = await oldDocRef.get();

          batch.set(newDocRef, docData.data()); // 새 문서에 데이터 설정
          batch.delete(oldDocRef); // 기존 문서 삭제
        }

        counter++;
      }

      await batch.commit(); // batch 작업 적용

      // 사용자 문서에 widgetOrder 필드 업데이트
      const userRef = firebase.firestore().collection("users").doc(userEmail);
      await userRef.update({
        widgetOrder: counter - 1,
      });

      console.log(
        "Updated Document names in 위젯 collection:",
        Array.from(
          { length: counter - 1 },
          (_, i) => `${i + 1}_${docNames[i].split("_")[1]}`
        )
      );
    } catch (error) {
      console.error("Error updating document names using batch:", error);
    }
  };

  //모달 삭제 기능 구현하기
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const showDeleteModal = () => {
    setIsDeleteModalVisible(true);
  };
  const hideDeleteModal = () => {
    setIsDeleteModalVisible(false);
  };

  const handleDelete = async () => {
    try {
      const widgetsRef =
        selectedGroup === "My Calendar"
          ? firebase
              .firestore()
              .collection("users")
              .doc(userEmail)
              .collection("위젯")
          : firebase
              .firestore()
              .collection("Group calendar")
              .doc(selectedGroup)
              .collection("위젯");

      const allDocs = await widgetsRef.get();

      // 문서 ID의 끝 부분이 title과 일치하는 문서를 필터링
      const matchingDocs = allDocs.docs.filter((doc) => {
        const docId = doc.id;
        return docId.endsWith(title);
      });

      // 일치하는 문서들을 삭제
      for (let doc of matchingDocs) {
        await doc.ref.delete();
      }

      // 로컬 상태인 widgets에서 일치하는 항목을 제거하고, state를 업데이트
      const updatedWidgets = widgets.filter((widget) =>
        widget.id ? !widget.id.endsWith(title) : true
      );

      setWidgets(updatedWidgets);
      hideDeleteModal();

      await onDelete_list_update(); // 순서를 업데이트합니다
    } catch (error) {
      console.error("Error deleting the widget:", error);
    }
  };

  //메모 수정하기
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [currentMemo, setCurrentMemo] = useState(null);
  const getToday = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${year}.${month}.${day}`;
  };

  const updateItem = async () => {
    const today = getToday();
    const docName = `${today}_${currentMemo.title}`;

    // 데이터베이스에 접근할 경로를 설정
    let targetCollection, targetDoc;
    if (selectedGroup === "My Calendar") {
      targetCollection = "users";
      targetDoc = userEmail;
    } else {
      targetCollection = "Group calendar";
      targetDoc = selectedGroup;
    }

    const memosRef = firebase
      .firestore()
      .collection(targetCollection)
      .doc(targetDoc)
      .collection("메모");

    try {
      // 원래 메모 삭제
      const originalDocName = `${memo.date}_${title}`;
      await memosRef.doc(originalDocName).delete();

      // 새로운 데이터로 메모 추가
      await memosRef.doc(docName).set({
        date: today,
        title: currentMemo.title,
        text: currentMemo.text,
      });

      // 상태 업데이트
      setMemo({
        date: today,
        title: currentMemo.title,
        text: currentMemo.text,
      });

      setIsEditModalVisible(false); // 모달 닫기
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.widgetBox}
        onLongPress={showDeleteModal}
        onPress={() => {
          setCurrentMemo(memo);
          setIsEditModalVisible(true);
        }}
      >
        <LinearGradient
          colors={["#FFC999", "#FFEB3B", "#FFEB3B"]} // 노란색 그라디언트
          style={{ flex: 1, borderRadius: 10 }}
        >
          <Text style={styles.titleText}>{memo?.title}</Text>
          <View style={styles.customUnderline} />
          <Text style={styles.memoText}>{memo?.text}</Text>
          <View
            style={{
              flex: 1,
              justifyContent: "flex-end",
              alignItems: "flex-end",
            }}
          >
            <Text style={styles.dateText}>updated at _ {memo?.date}</Text>
          </View>
        </LinearGradient>

        <DeleteModal
          isVisible={isDeleteModalVisible}
          onDelete={handleDelete}
          onClose={hideDeleteModal}
        />
      </TouchableOpacity>
      <Modal
        animationType="fade"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => {
          setIsEditModalVisible(false);
        }}
      >
        <View style={styles.centeredModal}>
          <View style={[styles.widgetBox2, { justifyContent: "center" }]}>
            <LinearGradient
              colors={["#FFC999", "#FFEB3B", "#FFEB3B"]}
              style={{
                flex: 1,
                borderRadius: 10,
                justifyContent: "space-between",
              }} // 여기 수정
            >
              <View>
                {/* 이 부분 추가 */}
                <TextInput
                  style={styles.titleText}
                  value={currentMemo?.title}
                  multiline={true}
                  numberOfLines={2}
                  onChangeText={(text) =>
                    setCurrentMemo((prev) => ({ ...prev, title: text }))
                  }
                />
                <View style={styles.customUnderline} />
                <TextInput
                  style={styles.memoText}
                  value={currentMemo?.text}
                  multiline={true}
                  numberOfLines={6}
                  onChangeText={(text) =>
                    setCurrentMemo((prev) => ({ ...prev, text: text }))
                  }
                />
              </View>
              <View
                style={{
                  justifyContent: "space-around",
                  alignItems: "center",
                  flexDirection: "row",
                  marginBottom: 5,
                }}
              >
                <TouchableOpacity
                  onPress={async () => {
                    await updateItem();
                  }}
                >
                  <Icon name="save" size={24} color="rgba(80,130,255,1)" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                  <Icon name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  ViewBox: {
    flexDirection: "row", // 가로 방향으로 아이템 배치
    flexWrap: "wrap", // 아이템이 화면 너비를 초과하면 다음 행으로 이동
    backgroundColor: "white",
  },
  widgetBox: {
    width: itemWidth,
    height: 200, // height는 width와 동일하게 설정1
    margin: (width * 0.05 - 8) / 2, // 각 요소 사이의 간격 조정
    borderRadius: 11, // 디자인 향상을 위한 라운드 처리
    borderColor: "#FFC999", // 검은색의 테두리 추가
    borderWidth: 1, // 테두리 두께 설정
  },
  widgetBox2: {
    width: 170,
    height: 240, // height는 width와 동일하게 설정1
    margin: (width * 0.05 - 8) / 2, // 각 요소 사이의 간격 조정
    borderRadius: 11, // 디자인 향상을 위한 라운드 처리
    borderColor: "#FFC999", // 검은색의 테두리 추가
    borderWidth: 1, // 테두리 두께 설정
  },
  titleText: {
    paddingTop: 10,
    padding: 5,
    fontWeight: "500",
    fontSize: 14,
    maxHeight: 48, // fontSize x 2
    overflow: "hidden", // 높이를 넘어가는 부분은 숨김
  },
  customUnderline: {
    marginHorizontal: 5,
    height: 1, // 밑줄 두께
    width: "80%", // 밑줄 길이
    backgroundColor: "#BB9999", // 밑줄 색상
    marginTop: 0, // 밑줄과 텍스트 사이의 거리
  },
  memoText: {
    padding: 5,
    fontWeight: "200",
    fontSize: 12,
  },
  dateText: {
    padding: 5,
    fontSize: 8,
    alignSelf: "flex-end", // 오른쪽 정렬
  },
  centeredModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)", // 화면을 반투명 검정색으로 덮어서 모달 뒤의 내용을 가립니다.
  },
});
