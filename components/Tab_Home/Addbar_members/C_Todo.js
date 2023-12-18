import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  FlatList,
  Button,
  Modal,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import { firebase } from "../../../../Afirebaseconfig";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

export default function Todo(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [showTodoFolderModal, setShowTodoFolderModal] = useState(false); //inputModal
  const db = firebase.firestore();

  //DateTimePicker
  const [date, setDate] = useState(new Date()); // 기본 날짜 설정
  const [showPicker, setShowPicker] = useState(false); // 날짜 선택기 보이기/숨기기
  // 날짜가 변경될 때 호출되는 함수
  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowPicker(false);
    setDate(currentDate);
  };
  // 현재 날짜를 상태 변수로 저장
  const [today, setToday] = useState(new Date());
  //선택한 날짜 초기화를 위해
  const [selectedDate, setSelectedDate] = useState(new Date());
  const handleCloseModal = () => {
    setShowTodoFolderModal(false); // 모달 닫기
    setDate(new Date()); // 선택한 날짜 초기화
  };
  // 컴포넌트가 마운트될 때 현재 날짜를 설정
  useEffect(() => {
    setToday(new Date());
  }, []);

  //Todo의 날짜 등록을 위한 날짜데이터형식 포매팅
  const formatDate = (date) => {
    let day = date.getDate();
    let month = date.getMonth() + 1; // 0-based indexing
    let year = date.getFullYear();
    // 숫자가 10 미만인 경우 앞에 0을 붙입니다.
    day = day < 10 ? `0${day}` : day;
    month = month < 10 ? `0${month}` : month;
    return `${year}-${month}-${day}`; // '-' 구분자를 사용하여 반환
  };
  const selectedDateStr = formatDate(date);

  //TodoList불러오기
  const [TodoLists, setTodoLists] = useState([]); // 불러올 Todo들을 담는 변수
  const [viewMode, setViewMode] = useState("current"); // 'current' 또는 'past' (보기 방식)

  // Todo 목록을 Firestore로부터 불러오는 함수
  const fetchTodos = () => {
    let docRef;

    if (props.selectedGroup === "My Calendar") {
      // 'My Calendar'를 사용할 때의 로직
      const userEmail = firebase.auth().currentUser.email;
      docRef = db.collection("users").doc(userEmail).collection("Todo");
    } else {
      // 'Group calendar'를 사용할 때의 로직
      docRef = db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo");
    }

    // onSnapshot은 변경 사항을 감지하고 호출되는 리스너입니다.
    const unsubscribe = docRef.onSnapshot(
      (snapshot) => {
        const todos = [];
        snapshot.forEach((doc) => {
          todos.push({ id: doc.id, ...doc.data() });
        });

        setTodoLists(todos);
      },
      (error) => {
        console.error("Error fetching todos: ", error);
      }
    );

    // useEffect와 같은 Hook 내에서 fetchTodos 함수를 호출하면
    // 컴포넌트가 언마운트될 때 unsubscribe 함수를 호출하여 리스너를 정리해야 합니다.
    return unsubscribe;
  };

  const handleAuthStateChanged = (user) => {
    if (user) {
      fetchTodos();
    }
  };

  useEffect(() => {
    const unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuthStateChanged);

    // 사용자가 처음 로그인을 했을 경우에만 loadFriends() 함수를 호출
    if (firebase.auth().currentUser) {
      fetchTodos();
    }
    return () => unsubscribe();
  }, []);

  //Todo 보기방식에 따른 필터링
  const isSameDay = (date1, date2) => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };
  const filteredTodos = TodoLists.filter((TodoList) => {
    const todoDate = new Date(TodoList.date);
    if (viewMode === "current") {
      return todoDate > today || isSameDay(todoDate, today);
    } else {
      return todoDate < today && !isSameDay(todoDate, today);
    }
  });
  // 지난 Todo를 보려면 역순으로 정렬
  if (viewMode === "past") {
    filteredTodos.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  //Todo폴더 만들기
  const registerTodo = async () => {
    const selectedDateStr = formatDate(date);

    let docRef;

    if (props.selectedGroup === "My Calendar") {
      docRef = db
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("Todo")
        .doc(selectedDateStr);
    } else {
      // 'Group calendar'를 사용할 때의 로직
      docRef = db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo")
        .doc(selectedDateStr);
    }

    const doc = await docRef.get();

    if (!doc.exists) {
      // 만약 문서가 존재하지 않는다면
      docRef
        .set({
          date: selectedDateStr,
          Done: false,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
        })
        .catch((error) => {
          console.error("Error writing document: ", error);
        });
    } else {
      console.log("Document already exists.");
    }

    setDate(today);
  };

  const deleteTodo = async (todoId) => {
    console.log(todoId);
    const userEmail = firebase.auth().currentUser.email;

    if (props.selectedGroup === "My Calendar") {
      const todoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("Todo")
        .doc(selectedTodoDate)
        .collection("TodoList")
        .doc(todoId);

      await todoRef.delete();
    } else {
      const todoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo")
        .doc(selectedTodoDate)
        .collection("TodoList")
        .doc(todoId);

      await todoRef.delete();
    }
  };

  const deleteTodoDate = async (tododate) => {
    console.log(tododate);
    const userEmail = firebase.auth().currentUser.email;

    if (props.selectedGroup === "My Calendar") {
      const todoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("Todo")
        .doc(tododate);

      await todoRef.delete();
    } else {
      const todoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo")
        .doc(tododate);

      await todoRef.delete();
    }
  };

  //각각의 Todo를 누르면 상세 내용이 보이도록
  const [detailsModalVisible, setDetailsModalVisible] = useState(false); // 세부 항목 모달의 보이기/숨기기
  const [selectedTodoDate, setSelectedTodoDate] = useState(""); // 선택된 Todo의 날짜
  const [todoDetail, setTodoDetail] = useState(""); // 입력된 세부 항목 내용
  const [todoDetails, setTodoDetails] = useState({}); // 모든 Todo의 세부 항목

  // 2. Todo 리스트 항목 선택
  const openDetailsModal = (date) => {
    setSelectedTodoDate(date);
    setDetailsModalVisible(true);
  };

  //Todo 등록하기
  const addTodoToFirestore = async () => {
    if (!firebase.auth().currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    const userEmail = firebase.auth().currentUser.email;
    const todoData = {
      text: todoDetail, // 여기서 todoDetail은 TextInput에서 입력한 값
      completed: false,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    };

    try {
      if (props.selectedGroup === "My Calendar") {
        await firebase
          .firestore()
          .collection("users")
          .doc(userEmail)
          .collection("Todo")
          .doc(selectedTodoDate)
          .collection("TodoList")
          .doc(todoDetail) // 이 부분을 수정했습니다.
          .set(todoData);

        //alert("Todo가 성공적으로 추가되었습니다.");
        setTodoDetail(""); // Todo 추가 후 입력란 초기화
      } else {
        await firebase
          .firestore()
          .collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("Todo")
          .doc(selectedTodoDate)
          .collection("TodoList")
          .doc(todoDetail)
          .set(todoData);

        setTodoDetail("");
      }
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Todo 추가 중 오류가 발생했습니다.");
    }
  };

  const [todosForSelectedDate, setTodosForSelectedDate] = useState([]);

  useEffect(() => {
    if (!selectedTodoDate) return;
    const userEmail = firebase.auth().currentUser.email;
    let todoRef;

    if (props.selectedGroup === "My Calendar") {
      todoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("Todo")
        .doc(selectedTodoDate)
        .collection("TodoList")
        .orderBy("timestamp", "asc");
    } else {
      todoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo")
        .doc(selectedTodoDate)
        .collection("TodoList")
        .orderBy("timestamp", "asc");
    }

    const unsubscribe = todoRef.onSnapshot((snapshot) => {
      const fetchedTodos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTodosForSelectedDate(fetchedTodos);
    });

    return () => unsubscribe();
  }, [selectedTodoDate]);

  const todosWithGoal = [...todosForSelectedDate, { isGoalItem: true }];

  //각각의 Todo들의 이행이 되었는지
  const toggleTodoCompletion = async (todoId) => {
    const userEmail = firebase.auth().currentUser.email;
    let todoRef;

    if (props.selectedGroup === "My Calendar") {
      todoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("Todo")
        .doc(selectedTodoDate)
        .collection("TodoList")
        .doc(todoId);
    } else {
      todoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo")
        .doc(selectedTodoDate)
        .collection("TodoList")
        .doc(todoId);
    }

    const doc = await todoRef.get();
    if (!doc.exists) {
      console.log("No such document!");
      return;
    }
    await todoRef.update({
      completed: !doc.data().completed,
    });
  };

  //오늘의 Todo 완성
  useEffect(() => {
    if (!selectedTodoDate) {
      // selectedTodoDate가 비어 있으면 early return으로 처리
      // 나머지 로직이 실행되지 않도록 함.
      return;
    }

    const userEmail = firebase.auth().currentUser.email;
    let todoRef;

    if (props.selectedGroup === "My Calendar") {
      // 'My Calendar'를 선택했거나 selectedGroup이 설정되지 않았을 때
      todoRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("Todo")
        .doc(selectedTodoDate);
    } else {
      // 다른 그룹을 선택했을 때
      todoRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo")
        .doc(selectedTodoDate);
    }

    const todoListRef = todoRef.collection("TodoList");

    // onSnapshot을 사용하여 TodoList의 변경사항을 실시간으로 수신
    const unsubscribe = todoListRef.onSnapshot((snapshot) => {
      let allDone = true; // 모든 항목이 완료되었다고 가정

      if (snapshot.empty) {
        // 투두가 없을 때.
        allDone = false;
      } else {
        // 모든 Todo 항목을 반복하면서 완료되지 않은 항목이 있는지 확인
        snapshot.forEach((doc) => {
          if (!doc.data().completed) {
            allDone = false;
          }
        });
      }

      // 모든 항목의 완료 상태에 따라 상위 문서의 'Done' 값을 업데이트
      todoRef.update({ Done: allDone });

      // 로컬 상태도 업데이트
      setIsDone(allDone);
    });

    return () => unsubscribe();
  }, [selectedTodoDate]);

  const [isDone, setIsDone] = useState(false);

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
      console.log("Todo, ", powerdata);

      const docRef2 = await firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .doc(powerdata)
        .get();

      const qualificationdata = docRef2.data().Todo;
      setQualification(qualificationdata);
      console.log("투두 권한: ", qualification);
    }
  };

  //Redux

  const signatureStyles = useSelector(selectSignatureStyles);

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
          <View style={styles.modalView}>
            <View
              style={{
                width: "100%",
                marginLeft: 5,
                paddingBottom: 10,
                marginBottom: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                borderColor: "#e0e0e0",
                borderBottomWidth: 0.5,
                shadowColor: "#000",
              }}
            >
              {/* 모달창 닫기 버튼 (왼쪽 끝) */}
              <TouchableOpacity onPress={() => setModalVisible(!modalVisible)}>
                <Icon name="arrow-back" size={25} />
              </TouchableOpacity>
              {/* 오른쪽 끝에 위치할 컨테이너 */}
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setViewMode("current")}
                  style={{ height: 20 }}
                >
                  <Text
                    style={{
                      marginRight: 20,
                      fontWeight: viewMode === "current" ? "bold" : "normal",
                    }}
                  >
                    기본 보기
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setViewMode("past")}
                  style={{ height: 20 }}
                >
                  <Text
                    style={{
                      fontWeight: viewMode === "past" ? "bold" : "normal",
                    }}
                  >
                    지난 Todo 보기
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 각각의 폴더 렌더링 *********************************/}
            <FlatList
              showsVerticalScrollIndicator={false}
              data={filteredTodos}
              renderItem={({ item: TodoList }) => (
                <TouchableOpacity
                  style={styles.TodoButton}
                  onPress={() => openDetailsModal(TodoList.id)}
                >
                  <Image
                    source={
                      TodoList.Done
                        ? require("../../../assets/Todo.png")
                        : require("../../../assets/Notcompleted_Todo.png")
                    }
                    style={{ width: 70, height: 70 }}
                  />
                  <Text style={styles.TodoTitleText}>{TodoList.id}</Text>
                </TouchableOpacity>
              )}
              numColumns={4} // 5개의 항목을 한 줄에 표시
              keyExtractor={(TodoList, index) => index.toString()}
            />

            {/* Todo 생성 버튼1 ***************************************/}
            <TouchableOpacity
              style={{ marginTop: "auto", marginRight: "auto" }}
              onPress={() => setShowTodoFolderModal(!showTodoFolderModal)} // 여기에 onPress 이벤트를 추가
            >
              <Image
                source={require("../../../assets/Todo.png")}
                style={{ width: 30, height: 30 }}
              />
            </TouchableOpacity>

            {/* 투두폴더를 생성하도록 하는 모달창 **********************************************/}
            <Modal
              animationType="fade"
              transparent={true} // 수정: true로 변경하여 배경을 투명하게 만듭니다.
              visible={showTodoFolderModal}
              onRequestClose={() => {
                setShowTodoFolderModal(false);
              }}
            >
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { height: 320 }]}>
                  <View
                    style={{
                      marginLeft: 0,
                      paddingBottom: 5,
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
                      onPress={handleCloseModal}
                    >
                      <Icon name="arrow-back" size={25} color="black" />
                    </TouchableOpacity>
                    <Text
                      style={{
                        flex: 1,
                        textAlign: "center",
                        fontWeight: "400",
                        fontSize: 14,
                        left: 20,
                      }}
                    >
                      Todo 생성
                    </Text>
                    {/* 작은 모달 안의 "폴더 생성" 버튼1 */}
                    <TouchableOpacity
                      style={styles.foldergenerator}
                      onPress={() => {
                        registerTodo(); // 아이템을 추가
                        setShowTodoFolderModal(false); // 모달을 닫음
                      }}
                    >
                      <Text
                        style={{
                          color: "rgba(0, 105, 185, 1)",
                          fontWeight: "500",
                        }}
                      >
                        등록
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {/* 현재 날짜 표시 */}
                  <Text style={{ marginTop: 5, fontSize: 12 }}>
                    Today :{" "}
                    <Text style={{ fontSize: 13, fontWeight: "500" }}>
                      {today.toLocaleDateString()}
                    </Text>
                  </Text>

                  <Image
                    source={require("../../../assets/Todo.png")}
                    style={{ width: 150, height: 150 }}
                  />
                  {/* 선택된 날짜 표시 */}
                  <Text style={{ marginBottom: 10, fontSize: 12 }}>
                    Selected: :{" "}
                    <Text style={{ fontSize: 14, fontWeight: "500" }}>
                      {date.toLocaleDateString()}
                    </Text>
                  </Text>

                  {Platform.OS === "ios" && (
                    <DateTimePicker
                      style={{ right: 5 }}
                      value={date}
                      mode="date"
                      display="calendar"
                      onChange={onChange}
                    />
                  )}

                  {Platform.OS === "android" && (
                    <View>
                      <TouchableOpacity
                        style={styles.dateSelector}
                        onPress={() => {
                          setShowPicker(true);
                        }}
                      >
                        <Text style={styles.registertext}>날짜 선택</Text>
                      </TouchableOpacity>

                      {showPicker && (
                        <DateTimePicker
                          value={date}
                          mode="date"
                          display="calendar"
                          onChange={onChange}
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>
            </Modal>
            {/* 3. 각각의 Todo폴더 내부 ************************************** */}
            <Modal
              animationType="fade"
              transparent={true} // 수정: true로 변경하여 배경을 투명하게 만듭니다.
              visible={detailsModalVisible}
              onRequestClose={() => setDetailsModalVisible(false)}
            >
              <View style={styles.modalContainer}>
                <View style={[styles.modalContent, { height: 380 }]}>
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
                      onPress={() => setDetailsModalVisible(false)}
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
                      {selectedTodoDate}
                    </Text>
                    <View style={{ width: 25 }}></View>
                  </View>
                  <View style={styles.horizontalContainer}>
                    <TextInput
                      style={styles.input}
                      value={todoDetail}
                      onChangeText={setTodoDetail}
                      placeholder="Add detail..."
                    />
                    <TouchableOpacity
                      onPress={addTodoToFirestore}
                      style={{ right: 10 }}
                    >
                      <Icon name="add-circle-outline" size={25} />
                    </TouchableOpacity>
                  </View>

                  <FlatList
                    style={{ width: "80%", backgroundColor: "white" }}
                    data={todosWithGoal}
                    renderItem={({ item, index }) => {
                      // "목표 달성" 항목을 렌더링하는 경우
                      if (item.isGoalItem) {
                        const currentTodo = TodoLists.find(
                          (todo) =>
                            formatDate(new Date(todo.date)) === selectedTodoDate
                        );
                        const isDone = currentTodo ? currentTodo.Done : false;
                        return (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginVertical: 8,
                            }}
                          >
                            <Icon
                              name="wb-incandescent"
                              size={16}
                              color={isDone ? "black" : "red"}
                            />
                            <Text style={{ flex: 1, marginLeft: 10 }}>
                              목표 달성
                            </Text>
                          </View>
                        );
                      }

                      // 그 외의 항목들을 렌더링하는 경우
                      return (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between", // 이 부분을 추가
                            marginVertical: 8,
                            width: "100%",
                          }}
                        >
                          <TouchableOpacity
                            style={{
                              flexDirection: "row",
                              alignItems: "center", // 아이콘과 텍스트를 중앙에 정렬하기 위해 추가
                            }}
                            onPress={() => toggleTodoCompletion(item.id)}
                          >
                            <Icon
                              name={
                                item.completed
                                  ? "check-box"
                                  : "check-box-outline-blank"
                              }
                              size={16}
                              color="black"
                            />
                            <Text
                              style={[
                                { marginLeft: 10 },
                                item.completed
                                  ? { textDecorationLine: "line-through" }
                                  : {},
                              ]}
                            >
                              {item.text}
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={{
                              alignSelf: "center", // 아이템이 수직 중앙에 위치하도록
                              padding: 5, // 버튼의 패딩 추가
                            }}
                            onPress={() => deleteTodo(item.id)}
                          >
                            <Text>삭제</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }}
                    keyExtractor={(item, index) =>
                      item.isGoalItem ? `goal-${index}` : item.id.toString()
                    }
                    extraData={isDone}
                  />

                  <TouchableOpacity
                    onPress={() => {
                      deleteTodoDate(selectedTodoDate);
                      setDetailsModalVisible(false);
                    }}
                    style={{
                      position: "absolute",
                      bottom: 10,
                      left: 12,
                      width: 70,
                      borderWidth: 1,
                      borderColor: "rgba(255,0,0,1)",
                      borderRadius: 5,
                    }}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontWeight: "400",
                        fontSize: 12,
                        color: "red",
                      }}
                    >
                      전체 삭제
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>
        </View>
      </Modal>

      {/* 해당 모달 진입 버튼 */}
      <TouchableOpacity
        // style={[styles.button, styles.buttonClose]}
        onPress={() => {
          if (props.selectedGroup === "My Calendar") {
            setModalVisible(true);
            fetchTodos();
          } else {
            setModalVisible(qualification);
            if (qualification === false) {
              Alert.alert("권한 알림", "투두에 대한 권한이 없습니다.");
            } else {
              fetchTodos();
            }
          }
        }}
      >
        <Icon
          name="event-available"
          size={25}
          style={[signatureStyles ? signatureStyles.Textcolor : {}]}
        ></Icon>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: "90%",
    height: 500,
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
  //투두 생성 모달창 스타일
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)", // 반투명한 검은색 배경
  },
  modalContent: {
    width: 280,
    height: 350,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateSelector: {
    alignItems: "center",
    justifyContent: "center",
    width: 100,
    height: 30,
    margin: 5,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.7)",
    borderRadius: 8,
  },
  foldergenerator: {
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    height: 24,
    margin: 5,
    backgroundColor: "rgba(255,255,255,1)",
    borderWidth: 1.5,
    borderColor: "rgba(0, 155, 255, 1)",
    borderRadius: 10,
  },
  registertext: {
    //등록 버튼 스타일링
  },
  //투두 내 폴더
  TodoTitleText: {
    fontSize: 12, // 글자 크기 설정
  },
  TodoButton: {
    margin: 5,
  },
  horizontalContainer: {
    width: "95%",
    flexDirection: "row",
    alignItems: "center", // 요소들을 수직 중앙에 배치
    justifyContent: "space-between", // 요소 사이에 공간을 최대한 띄움
    margin: 10, // 적절한 마진
  },
  input: {
    borderWidth: 1, // 테두리
    borderColor: "lightgray", // 테두리 색
    padding: 5, // 내부 패딩
    width: "75%", // 원하는 너비. 필요에 따라 조정 가능
    marginLeft: 10, // 텍스트와 입력란 사이의 간격
  },
  //폴더 닫기 버튼
  closeButton: {
    position: "absolute",
    top: "100%",
    right: 10,
    zIndex: 2,
  },
  closeFolderButton: {
    position: "absolute",
    top: "5%",
    left: 10,
    zIndex: 2,
  },
});
