import React, { useState, useEffect } from "react";
import {
  View,
  Modal,
  Button,
  StyleSheet,
  Text,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { firebase } from "../../../../Afirebaseconfig";
import DraggableFlatList from "react-native-draggable-flatlist";

const DeleteModal = ({ isVisible, onDelete, onClose }) => {
  const [showWidgetList, setShowWidgetList] = useState(false);
  const [draggedWidgets, setDraggedWidgets] = useState(widgets); // 위젯들의 드래그 후 순서를 저장할 상태

  useEffect(() => {
    if (!showWidgetList) return; // showWidgetList가 false일 때는 아무것도 실행하지 않음
    console.log("순서변경 리스트 로딩");
    if (showWidgetList) {
      const userEmail = firebase.auth().currentUser.email;
      const widgetsRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("위젯");

      widgetsRef.get().then((querySnapshot) => {
        const widgetNames = [];
        querySnapshot.forEach((doc) => {
          widgetNames.push(doc.id); // doc의 이름들만 저장합니다..
        });
        setWidgets(widgetNames);
      });
    }
  }, [showWidgetList]);

  const [widgets, setWidgets] = useState([]);
  //draggable로 순서 바꾸고, 순서 업데이트
  const updateUserWidgets = async (newWidgets) => {
    const userEmail = firebase.auth().currentUser.email;
    const userRef = firebase.firestore().collection("users").doc(userEmail);
    const widgetsRef = userRef.collection("위젯");

    const batch = firebase.firestore().batch();

    // 1. 기존 문서들을 삭제
    const currentDocs = await widgetsRef.get();
    currentDocs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 2. 새로운 순서로 문서들을 생성
    let lastOrder = 0; // 마지막 순서를 저장하기 위한 변수
    newWidgets.forEach((widgetName, index) => {
      // 숫자 부분을 제거
      const cleanWidgetName = widgetName.split("_").slice(1).join("_");
      const newDocName = `${index + 1}_${cleanWidgetName}`;
      batch.set(widgetsRef.doc(newDocName), {
        /* 필요한 데이터 구조 */
      });
      lastOrder = index + 1; // 순서 업데이트
    });

    // 3. widgetOrder 값 업데이트
    batch.update(userRef, { widgetOrder: lastOrder });
    // batch commit
    await batch.commit();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={showWidgetList ? styles.largeModalView : styles.modalView}>
          {showWidgetList ? (
            <>
              <DraggableFlatList
                data={widgets}
                renderItem={({ item, drag, isActive }) => (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPressOut={() => {}}
                    style={{
                      height: 50,
                      width: 200,
                      backgroundColor: isActive
                        ? "rgba(200, 200, 200, 0.5)"
                        : "white",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onLongPress={drag}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => `draggable-item-${item}`}
                onDragEnd={({ data: newData }) => {
                  setWidgets(newData);
                }}
              />
              <Button
                title="닫기"
                onPress={async () => {
                  await updateUserWidgets(widgets); // 순서 변경을 반영
                  setShowWidgetList(false);
                }}
              />
            </>
          ) : (
            <>
              <Button
                title="삭제"
                // onPress={async () => {
                //   onDelete();
                // }}
                onPress={onDelete}
              />
              <Button title="닫기" onPress={onClose} />
              <Button
                title="순서 변경"
                onPress={() => setShowWidgetList(true)}
              />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    flexDirection: "row",
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: 200,
    height: 100,
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
    justifyContent: "center",
  },
  largeModalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: "80%",
    height: "80%",
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
    justifyContent: "center",
  },
});

export default DeleteModal;
