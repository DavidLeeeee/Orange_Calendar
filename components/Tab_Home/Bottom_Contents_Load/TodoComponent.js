import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  TouchableOpacity,
  Modal,
  Button,
} from "react-native";
import { firebase } from "../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import DeleteModal from "./Delete_Modal";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3;

export default function TodoComponent({
  date,
  widgets,
  setWidgets,
  selectedGroup,
}) {
  const [todos, setTodos] = useState([]);
  const userEmail = firebase.auth().currentUser.email;
  const [refresh, setRefresh] = useState(false); // refresh 상태 추가.
  //refresh라는 새로운 상태를 만들어서 데이터를 다시 불러와야 할 때만 이 값을 변경하여 useEffect가 실행되게 합니다.

  const subscribeToTodosForDate = () => {
    console.log({ date }, `날의 투두 위젯 렌더링`);

    try {
      const todosRef =
        selectedGroup === "My Calendar"
          ? firebase
              .firestore()
              .collection("users")
              .doc(userEmail)
              .collection("Todo")
              .doc(date)
              .collection("TodoList")
          : firebase
              .firestore()
              .collection("Group calendar")
              .doc(selectedGroup)
              .collection("Todo")
              .doc(date)
              .collection("TodoList");

      // 실시간 동기화를 위해 onSnapshot 사용
      return todosRef.onSnapshot(
        (snapshot) => {
          const fetchedTodos = snapshot.docs.map((doc) => doc.data());
          setTodos(fetchedTodos);
        },
        (error) => {
          console.error(Error`fetching todos for date ${date}:`, error);
        }
      );
    } catch (error) {
      console.error(
        Error`setting up todos subscription for date ${date}:`,
        error
      );
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToTodosForDate();

    return () => unsubscribe();
  }, [refresh]);

  const toggleTodoCompletion = async (todoId) => {
    const userEmail = firebase.auth().currentUser.email;

    let todoRef;
    if (selectedGroup === "My Calendar") {
      todoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("Todo")
        .doc(date)
        .collection("TodoList")
        .doc(todoId);
    } else {
      todoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(selectedGroup)
        .collection("Todo")
        .doc(date)
        .collection("TodoList")
        .doc(todoId);
    }

    // 해당 Todo 항목의 현재 'completed' 값을 가져옵니다.
    const doc = await todoRef.get();
    if (!doc.exists) {
      console.log(`Document with ID ${todoId} doesn't exist!`);
      return;
    }
    // 'completed' 값을 반전시켜 업데이트합니다.
    await todoRef.update({
      completed: !doc.data().completed,
    });
    setRefresh((prev) => !prev); // toggleTodoCompletion 후 refresh 상태 반전
  };

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
        return docId.endsWith(date);
      });

      // 일치하는 문서들을 삭제
      for (let doc of matchingDocs) {
        await doc.ref.delete();
      }

      // 로컬 상태인 widgets에서 일치하는 항목을 제거하고, state를 업데이트
      const updatedWidgets = widgets.filter((widget) =>
        widget.id ? !widget.id.endsWith(date) : true
      );

      setWidgets(updatedWidgets);
      hideDeleteModal();

      await onDelete_list_update(); // 순서를 업데이트합니다.
    } catch (error) {
      console.error("Error deleting the widget:", error);
    }
  };

  return (
    // style : 가장 바깥의 TouchableOpacity는 검은색의 테두리를 갖는다. 배경색은 흰색
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.widgetBox}
      onLongPress={showDeleteModal}
    >
      {/* style : date는 상단에 위치할 헤더이다.  배경 색은 검정색이고, 글자는 흰색으로 글씨 두께 400, 크기 12 이다.*/}
      <Text style={styles.dateText}>{date}</Text>

      {todos.map((todo, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => toggleTodoCompletion(todo.text)} // onPress 이벤트 추가
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginVertical: 3,
          }}
        >
          <Icon
            name={todo.completed ? "check-box" : "check-box-outline-blank"}
            size={12}
            color="black"
            onPress={() => toggleTodoCompletion(todo.text)}
            style={{ paddingLeft: 4 }} // 여기서 패딩 추가
          />
          <Text
            style={
              todo.completed ? styles.completedTodo : styles.incompletedTodo
            }
          >
            {todo.text}
          </Text>
        </TouchableOpacity>
      ))}
      <DeleteModal
        isVisible={isDeleteModalVisible}
        onDelete={handleDelete}
        onClose={hideDeleteModal}
        widgets={widgets}
        setWidgets={setWidgets}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ViewBox: {
    flexDirection: "row", // 가로 방향으로 아이템 배치
    flexWrap: "wrap", // 아이템이 화면 너비를 초과하면 다음 행으로 이동1
    backgroundColor: "white",
  },
  widgetBox: {
    overflow: "hidden",
    padding: 0,
    width: itemWidth,
    height: 200,
    backgroundColor: "white", // 배경색을 흰색으로 변경
    borderColor: "black", // 검은색의 테두리 추가
    borderWidth: 1, // 테두리 두께 설정
    margin: (width * 0.05 - 8) / 2,
    borderRadius: 10,
  },
  dateText: {
    padding: 5,
    fontSize: 12,
    fontWeight: "400",
    color: "white",
    backgroundColor: "black",
    width: "100%", // 너비를 100%로 설정하여 부모 컴포넌트의 전체 너비를 차지하게 함
    height: 30,
    lineHeight: 20, // 여기서 lineHeight 속성 추가
    textAlign: "center", // 텍스트를 가운데로 정렬
  },

  completedTodo: {
    fontSize: 12,
    textDecorationLine: "line-through", // 중간에 줄을 그어줍니다.
    padding: 2,
  },
  incompletedTodo: {
    fontSize: 12,
    padding: 2,
  },
});
