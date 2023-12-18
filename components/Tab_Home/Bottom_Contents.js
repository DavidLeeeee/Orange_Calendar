import React, { useState, useRef, useEffect } from "react";
import {
  FlatList,
  View,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Text,
  Modal,
  Animated, // Animated를 추가
  Button,
  ScrollView,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { firebase } from "../../../Afirebaseconfig";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { Image } from "expo-image";
import {
  fetchAndSetSignatureColor,
  getSignatureStyles,
} from "./SignatureColor";
import { Platform } from "react-native";

import Default from "./Bottom_Contents_Load/Default";

import SharePictures from "./Bottom_Contents_Load/SharePictures";
import EmotionComponent from "./Bottom_Contents_Load/EmotionComponents";
import MemoComponent from "./Bottom_Contents_Load/MemoComponent";
import MonthlyScheduleComponent from "./Bottom_Contents_Load/MonthlyScheduleComponent";
import TodayTodoComponent from "./Bottom_Contents_Load/TodayTodoComponent";
import TodoComponent from "./Bottom_Contents_Load/TodoComponent";
import DailyWeatherComponent from "./Bottom_Contents_Load/DailyWeatherComponent";
import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../Redux/selector";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3; //위젯의 크기 지정을 위한 변수
const boxImages = [
  require("../../assets/weather.png"), // 이미지 경로는 실제 경로로 변경해주세요
  require("../../assets/pic.png"),
  require("../../assets/Todo.png"),
  require("../../assets/Post.png"),
  require("../../assets/feel.png"),
];

export default function Bottom_Contents(props) {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  const [isToggleModalVisible, setToggleModalVisible] = useState(false);

  //선택지 창을 관리하는 변수
  const [isAnimationVisible, setAnimationVisible] = useState(false);
  // 애니메이션 수행을 위한 변수
  const animationValue = useRef(new Animated.Value(0)).current;
  // 애니메이션 시작 함수*************************************************************************
  const startAnimation = () => {
    Animated.timing(animationValue, {
      toValue: isAnimationVisible ? 0 : 1,
      duration: 400,
      useNativeDriver: false,
    }).start(() => {
      // 애니메이션 끝나고 아이콘 변경
      setAnimationVisible(!isAnimationVisible);
    });
  };

  //애니메이션 박스 렌더링
  const renderAnimatedBoxes = () => {
    const boxes = [];

    for (let i = 0; i < 5; i++) {
      // 그룹을 선택 중이고 i가 5(감정버튼)일 때 continue를 사용하여 이번 루프를 건너뛰기
      if (props.selectedGroup !== "My Calendar" && i === 4) {
        continue;
      }

      const content = (
        <Image source={boxImages[i]} style={{ width: 50, height: 50 }} />
      );

      if (Platform.OS === "android") {
        // Android일 때: 애니메이션을 제외하고 TouchableOpacity만 렌더링
        boxes.push(
          <View key={i}>
            <TouchableOpacity
              onPress={() => {
                handleBoxPress(i);
                handleAddPress();
              }}
            >
              {content}
            </TouchableOpacity>

            <View style={{ padding: 10 }}></View>
          </View>
        );
      } else {
        // iOS일 때: 애니메이션과 함께 렌더링
        boxes.push(
          <TouchableOpacity
            key={i}
            onPress={() => {
              handleBoxPress(i);
              handleAddPress();
            }}
            style={{
              position: "absolute",
              top: "37%",
              left: "30.5%",
            }}
          >
            <Animated.View
              style={{
                ...styles.animatedBox,
                marginTop: animationValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, (i + 1) * -50],
                }),
                opacity: animationValue,
              }}
            >
              {content}
            </Animated.View>
          </TouchableOpacity>
        );
      }
    }

    return boxes;
  };

  //각각의 박스가 일을 수행하기 위한 함수 ******************************************************************
  const [isMemoModalVisible, setMemoModalVisible] = useState(false);
  const [memos, setMemos] = useState([]);
  const loadMemos = async () => {
    const fetchedMemos = await fetchUserMemos();
    setMemos(fetchedMemos);
  };

  const handleMemoSelect = async (selectedMemo) => {
    const memoTitle = selectedMemo.title;

    // 중복 체크: widgets 배열을 순회하면서 memoTitle과 동일한 title을 가진 위젯이 있는지 확인
    const isDuplicate = widgets.some((widget) => widget.title === memoTitle);

    if (isDuplicate) {
      // 중복될 경우 경고를 띄우고 함수를 종료합니다.
      alert(`${memoTitle} 위젯이 이미 존재합니다.`);
      return; // 여기서 함수를 종료하므로 아래 코드는 실행되지 않습니다.
    }

    // 위젯을 저장하는 함수를 호출합니다.
    await saveMemoToWidget(selectedMemo);

    // 모달을 닫습니다.
    setMemoModalVisible(false);
  };

  const fetchUserMemos = async () => {
    let userRef;

    if (props.selectedGroup === "My Calendar") {
      userRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("메모");
    } else {
      userRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("메모");
    }

    const snapshot = await userRef.get();
    const memos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return memos;
  };

  const saveMemoToWidget = async (selectedMemo) => {
    let widgetRef;

    if (props.selectedGroup === "My Calendar") {
      widgetRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("위젯");
    } else {
      widgetRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("위젯");
    }

    const currentWidgetOrder = await getAndUpdateWidgetOrder();
    const docName = `${currentWidgetOrder}_메모-${selectedMemo.title}`;
    const { id, ...memoData } = selectedMemo;
    await widgetRef.doc(docName).set(memoData);
  };

  // 투두 모달을 위한 상태 변수.
  const [isTodoModalVisible, setTodoModalVisible] = useState(false);
  const [todos, setTodos] = useState([]);

  // 투두 선택하기
  const handleTodoSelect = async (selectedDate) => {
    // 투두의 중복 체크 (fetchWidgets 호출 대신 widgets 상태 사용)
    const isDuplicate = widgets.some(
      (widget) => widget.name === `투두+${selectedDate}`
    );

    if (isDuplicate) {
      alert(`투두+${selectedDate} 위젯이 이미 존재합니다.`);
    } else {
      // Todo 추가 로직
      let widgetRef;
      if (props.selectedGroup === "My Calendar") {
        widgetRef = firebase
          .firestore()
          .collection("users")
          .doc(firebase.auth().currentUser.email)
          .collection("위젯");
      } else {
        widgetRef = firebase
          .firestore()
          .collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("위젯");
      }

      const currentWidgetOrder = await getAndUpdateWidgetOrder();
      const docName = `${currentWidgetOrder}_투두+${selectedDate}`;
      await widgetRef.doc(docName).set({
        name: selectedDate,
      });
    }

    setTodoModalVisible(false); // 모달을 닫습니다.
  };

  const [showPastTodos, setShowPastTodos] = useState(false);
  // '지난 날짜' 버튼의 스타일을 결정하는 함수
  const pastButtonStyle = showPastTodos
    ? styles.pastButtonActive
    : styles.pastButtonInactive;

  // '지난 날짜' 버튼의 텍스트 스타일을 결정하는 함수
  const pastButtonTextStyle = showPastTodos
    ? styles.pastButtonTextActive
    : styles.pastButtonTextInactive;

  // 지난 날짜 또는 미래 날짜의 Todo 목록을 불러오는 함수를 변경합니다.
  useEffect(() => {
    // showPastTodos 상태가 변경될 때 마다 loadTodos 함수를 호출합니다.
    loadTodos(showPastTodos);
  }, [showPastTodos]); // showPastTodos 상태를 의존성 배열에 추가합니다.

  const togglePastTodos = () => {
    // 상태를 토글합니다. 상태가 변경되면 useEffect 내부의 코드가 실행됩니다.
    setShowPastTodos((prevShowPastTodos) => !prevShowPastTodos);
  };

  // 투두 목록 불러오기 (단순히 문서 이름만)]
  const loadTodos = async () => {
    let todosRef;

    // 'My Calendar' 또는 'Group calendar'에 따라 참조를 설정합니다.
    if (props.selectedGroup === "My Calendar") {
      todosRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("Todo");
    } else {
      todosRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("Todo");
    }

    // 해당 컬렉션의 모든 문서를 가져옵니다.
    const snapshot = await todosRef.get();
    const todoDates = snapshot.docs.map((doc) => doc.id);

    // 위젯 배열에서 이미 등록된 날짜들을 추출합니다.
    const registeredDates = widgets
      .filter((widget) => /^(\d+_투두\+)/.test(widget.id))
      .map((widget) => widget.id.split("_투두+")[1]);

    // 오늘의 날짜를 구합니다.
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];

    let filteredTodoDates = todoDates.filter(
      (date) => !registeredDates.includes(date)
    );

    if (showPastTodos) {
      // '지난 날짜' 토글이 활성화되어 있다면, 오늘 날짜 이전의 투두만 필터링합니다.
      filteredTodoDates = filteredTodoDates
        .filter((date) => date < todayString)
        .sort((a, b) => (a > b ? -1 : 1))
        .slice(0 /* 필요한 개수 */); // 여기에 한 번에 불러올 투두의 개수를 지정합니다.
    } else {
      // '지난 날짜' 토글이 비활성화되어 있다면, 오늘 날짜를 포함하여 이후의 투두만 필터링합니다.
      filteredTodoDates = filteredTodoDates
        .filter((date) => date >= todayString)
        .sort((a, b) => (a > b ? 1 : -1));
    }

    // 중복되지 않은 날짜들을 상태에 설정합니다.
    setTodos(filteredTodoDates);
  };

  // '오늘의 투두'가 이미 등록되어 있는지 확인하는 함수
  const [todayTodoExists, setTodayTodoExists] = useState(false);

  const checkTodayTodoRegistered = () => {
    // 위젯 배열에서 '오늘의 투두' 이름을 가진 항목을 검색합니다.
    const isTodayTodoRegistered = widgets.some(
      (widget) => widget.name === "오늘의투두"
    );

    // '오늘의 투두'가 등록되어 있으면 상태를 true로 설정합니다.
    setTodayTodoExists(isTodayTodoRegistered);
  };

  //위젯 우선순위 결정하기 ***************************************************************************************
  const [widgetOrder, setWidgetOrder] = useState(0);

  const getAndUpdateWidgetOrder = async () => {
    const userEmail = firebase.auth().currentUser.email;
    let userRef;

    if (props.selectedGroup === "My Calendar") {
      // 'My Calendar'를 사용할 때의 로직
      userRef = firebase.firestore().collection("users").doc(userEmail);
    } else {
      // 'Group calendar'를 사용할 때의 로직
      userRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup);
    }

    const doc = await userRef.get();
    let currentOrder;

    if (doc.exists && doc.data().widgetOrder !== undefined) {
      currentOrder = doc.data().widgetOrder + 1;
    } else {
      currentOrder = 1;
    }

    setWidgetOrder(currentOrder);
    await userRef.update({ widgetOrder: currentOrder });

    return currentOrder;
  };

  //각각의 박스가 수행할 역할을 정의해준다. ************************************************************************
  const handleBoxPress = async (index) => {
    console.log(`Box ${index} pressed!`);
    let widgetSuffix;

    //메모버튼 클릭
    if (index === 3) {
      loadMemos();
      setMemoModalVisible(true);
      return;
    }
    //투두 버튼 클릭
    if (index === 2) {
      checkTodayTodoRegistered();
      loadTodos();
      setTodoModalVisible(true);
      return;
    }
    //감정버튼 클릭
    if (index === 4) {
      widgetSuffix = "이달의감정";
    }
    if (index === 1) {
      widgetSuffix = "사진공유함";
    }
    if (index === 0) {
      widgetSuffix = "오늘의날씨";
    }

    // 이미 존재하는 위젯인지 확인
    const existingWidget = widgets.find((widget) =>
      widget?.id?.includes(widgetSuffix)
    );

    if (existingWidget) {
      // 위젯이 이미 존재하면 경고 메시지를 표시하고 더 이상 진행하지 않음
      alert(`'${widgetSuffix}' 위젯은 이미 존재합니다.`);
      return;
    }

    //위젯 생성기 (공통사항용)
    const userEmail = firebase.auth().currentUser.email;
    let widgetRef;
    if (props.selectedGroup === "My Calendar") {
      widgetRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("위젯");
    } else {
      widgetRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("위젯");
    }

    // widgetOrder 값을 가져와서 업데이트
    const currentWidgetOrder = await getAndUpdateWidgetOrder();

    // doc 이름 설정
    const docName = `${currentWidgetOrder}_${widgetSuffix}`;
    widgetRef
      .doc(docName)
      .set({
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        // 문서에 필요한 다른 데이터를 여기에 추가
      })
      .then(() => {
        console.log(`'${docName}' 문서가 성공적으로 생성되었습니다.`);
      })
      .catch((error) => {
        console.error(`${widgetSuffix} 생성 중 오류 발생:`, error);
      });

    // 위젯 목록을 새로고침
    loadWidgets();
  };

  //하단 콘텐츠 렌더하기******************************************************************************************

  //마지막 요소인 애니메이션
  const handleAddPress = () => {
    if (Platform.OS === "android") {
      setToggleModalVisible((prevState) => !prevState);
    } else {
      startAnimation();
      setAnimationVisible((prevState) => !prevState);
    }
  };

  //위젯 로드하기
  const [widgets, setWidgets] = useState([]); // 위젯 데이터를 저장할 상태 변수

  const loadWidgets = () => {
    let widgetRef;

    if (props.selectedGroup === "My Calendar") {
      const userEmail = firebase.auth().currentUser.email;
      widgetRef = firebase
        .firestore()
        .collection("users")
        .doc(userEmail)
        .collection("위젯");
    } else {
      widgetRef = firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("위젯");
    }

    // onSnapshot을 사용하여 데이터 변경을 실시간으로 감지합니다.
    widgetRef.onSnapshot((snapshot) => {
      const fetchedWidgets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let userOrGroupRef;

      if (props.selectedGroup === "My Calendar") {
        const userEmail = firebase.auth().currentUser.email;
        userOrGroupRef = firebase
          .firestore()
          .collection("users")
          .doc(userEmail);
      } else {
        userOrGroupRef = firebase
          .firestore()
          .collection("Group calendar")
          .doc(props.selectedGroup);
      }

      userOrGroupRef.get().then((doc) => {
        const currentWidgetOrder = doc.data().widgetOrder;

        if (currentWidgetOrder < 9) {
          fetchedWidgets.push({ isLastItem: true });
        }

        setWidgets(fetchedWidgets); // 이 부분에서 컴포넌트가 리렌더링 됩니다.
      });
    });
  };

  useEffect(() => {
    // console.log("몇번이나 되나 보자");

    // Firebase 인증 상태 변화 감지 리스너 등록
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // 로그인이 완료되면 user 객체가 존재함
        console.log("로그인 되었습니다. 위젯을 로드합니다.");
        loadWidgets();
        console.log("+++++++++++++++++++++++++++++++++++++++++", widgets);
      } else {
        console.log("로그아웃 상태입니다.");
        // 필요하다면 로그아웃 시 처리할 로직을 여기에 추가
      }
    });
    // 컴포넌트가 언마운트 될 때 리스너 해제
    return () => unsubscribe();
  }, [props.selectedGroup]);

  //위젯이 삭제되거나 순서 변경이 있을 경우 다시 Load_Widget을.

  const renderContentBasedOnDocName = (docName = "") => {
    console.log("Received docName:", docName); // 여기 추가.
    //위젯 추가 버튼
    if (!docName) {
      if (Platform.OS === "android") {
        return (
          <View style={styles.widgetBoxforAdd}>
            <TouchableOpacity
              style={
                isToggleModalVisible
                  ? styles.squareWrapper
                  : styles.circleWrapper
              }
              onPress={() => {
                if (props.selectedGroup === "My Calendar") {
                  handleAddPress();
                } else {
                  if (qualification === false) {
                    Alert.alert("권한 알림", "위젯에 대한 권한이 없습니다.");
                  }else {
                    handleAddPress();
                  }
                }
              }}
            >
              <MaterialIcons
                name={isToggleModalVisible ? "remove" : "add"}
                size={30}
                color="rgba(10, 10, 10, 0.8)"
              />
            </TouchableOpacity>

            {isToggleModalVisible && (
              <View style={{ left: 45, marginBottom: 180 }}>
                {renderAnimatedBoxes()}
              </View>
            )}
          </View>
        );
      } else {
        return (
          <View style={styles.widgetBoxforAdd}>
            <TouchableOpacity
              style={
                isAnimationVisible ? styles.squareWrapper : styles.circleWrapper
              }
              onPress={() => {
                if (props.selectedGroup === "My Calendar") {
                  handleAddPress();
                } else {
                  if (qualification === false) {
                    Alert.alert("권한 알림", "위젯에 대한 권한이 없습니다.");
                  }else {
                    handleAddPress();
                  }
                }
              }}
            >
              <MaterialIcons
                name={isAnimationVisible ? "remove" : "add"}
                size={30}
                color="rgba(10, 10, 10, 0.8)"
              />
            </TouchableOpacity>
            {renderAnimatedBoxes()}
          </View>
        );
      }
    }

    const content = docName.split("_")[1]; //뒤 내용 추출
    switch (content) {
      case "이달의감정":
        return (
          <EmotionComponent
            widgets={widgets}
            setWidgets={setWidgets}
            selectedGroup={props.selectedGroup}
          />
        );
      case "오늘의투두":
        return (
          <TodayTodoComponent
            widgets={widgets}
            setWidgets={setWidgets}
            selectedGroup={props.selectedGroup}
          />
        );

      case "오늘의날씨":
        return (
          <DailyWeatherComponent
            widgets={widgets}
            setWidgets={setWidgets}
            selectedGroup={props.selectedGroup}
          />
        );
      case "사진공유함":
        return (
          <SharePictures
            widgets={widgets}
            setWidgets={setWidgets}
            selectedGroup={props.selectedGroup}
          />
        );
      default:
        if (content.indexOf("메모") === 0) {
          return (
            <MemoComponent
              title={content.split("-")[1]}
              widgets={widgets}
              setWidgets={setWidgets}
              selectedGroup={props.selectedGroup}
            />
          );
        }
        if (content.indexOf("투두") === 0) {
          return (
            <TodoComponent
              date={content.split("+")[1]}
              widgets={widgets}
              setWidgets={setWidgets}
              selectedGroup={props.selectedGroup}
            />
          );
        }
        return <Default />;
    }
  };

  //위젯 편집하기**********************************************************************************
  //이건 각각의 Component에서 처리할거야.

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
      console.log("Widget, ", powerdata);

      const docRef2 = await firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .doc(powerdata)
        .get();

      const qualificationdata = docRef2.data().Widget;
      setQualification(qualificationdata);
      console.log("위젯 권한: ", qualification);
    }
  };

  //요소들 매핑하기*********************************************************************************
  return (
    <View
      style={[styles.ViewBox, signatureStyles ? signatureStyles.field : {}]}
    >
      {/* <View
        style={{
          width: "100%",
          height: 40,
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <TouchableOpacity>
          <Text>as</Text>
        </TouchableOpacity>
      </View> */}
      {widgets.map((widget, index) => (
        <React.Fragment key={index}>
          {renderContentBasedOnDocName(widget.id)}
        </React.Fragment>
      ))}

      {/* Memo 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMemoModalVisible}
        onRequestClose={() => {
          setMemoModalVisible(!isMemoModalVisible);
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={styles.modalContainer}>
            {/* 모달 상단에 닫기 버튼 추가 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
                borderBottomWidth: 1, // 구분선을 위한 borderBottom 설정
                borderColor: "#e0e0e0", // 구분선 색상 설정
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                메모 선택
              </Text>
              <TouchableOpacity onPress={() => setMemoModalVisible(false)}>
                <Text style={{ color: "red" }}>닫기</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.scrollViewStyle}>
              {memos.map((memo) => (
                <TouchableOpacity
                  key={memo.id}
                  onPress={() => {
                    handleMemoSelect(memo);
                  }}
                  style={{ marginVertical: 2, marginLeft: 10 }} // 여기에 인라인 스타일 추가
                >
                  <Text>{memo.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Todo 선택 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isTodoModalVisible}
        onRequestClose={() => {
          setTodoModalVisible(!isTodoModalVisible);
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <View style={styles.modalContainer}>
            {/* 상단 제목 및 닫기 버튼 */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 10,
                borderBottomWidth: 1, // 구분선을 위한 borderBottom 설정.
                borderColor: "#e0e0e0", // 구분선 색상 설정
              }}
            >
              {/* Todo 선택 텍스트 */}
              <Text
                style={{ fontWeight: "bold", fontSize: 16, marginRight: 8 }}
              >
                Todo 선택
              </Text>

              {/* '지난 날짜' 버튼 */}
              <TouchableOpacity
                style={[pastButtonStyle, { marginRight: "auto" }]} // 오른쪽으로 자동 마진을 주어 다음 요소와의 거리를 최대로 함
                onPress={togglePastTodos}
              >
                <Text style={pastButtonTextStyle}>지난 Todo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setTodoModalVisible(false)}>
                <Text style={{ color: "red" }}>닫기</Text>
              </TouchableOpacity>
            </View>

            {/* '오늘의 Todo' 버튼 */}
            <TouchableOpacity
              style={[
                styles.todayTodoButton,
                todayTodoExists && styles.disabledButton, // 'todayTodoExists'가 true일 때 'disabledButton' 스타일 적용
              ]}
              disabled={todayTodoExists}
              onPress={async () => {
                let widgetRef;
                const userEmail = firebase.auth().currentUser.email;

                if (props.selectedGroup === "My Calendar") {
                  // 'My Calendar'가 선택되었을 때, 개인 컬렉션의 참조를 가져옵니다.
                  widgetRef = firebase
                    .firestore()
                    .collection("users")
                    .doc(userEmail)
                    .collection("위젯");
                } else {
                  // 다른 그룹이 선택되었을 때, 해당 그룹의 컬렉션 참조를 가져옵니다.
                  widgetRef = firebase
                    .firestore()
                    .collection("Group calendar")
                    .doc(props.selectedGroup)
                    .collection("위젯");
                }

                // widgetOrder 값을 가져와서 업데이트
                const currentWidgetOrder = await getAndUpdateWidgetOrder();

                // doc 이름을 `widgetOrder_투두 오늘의 투두` 형태로 설정
                const docName = `${currentWidgetOrder}_오늘의투두`;

                await widgetRef.doc(docName).set({
                  name: "오늘의투두",
                  timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                });

                setTodoModalVisible(false);
              }}
            >
              <Text style={todayTodoExists && styles.disabledButtonText}>
                오늘의 Todo
              </Text>
            </TouchableOpacity>
            <ScrollView style={styles.scrollViewStyle}>
              {todos.map((date) => (
                <TouchableOpacity
                  key={date}
                  onPress={() => {
                    handleTodoSelect(date);
                  }}
                  style={{ marginVertical: 2, marginLeft: 10 }} // 여기에 인라인 스타일 추가
                >
                  <Text>{date}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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
    height: itemWidth, // height는 width와 동일하게 설정1
    backgroundColor: "rgba(200, 200, 200, 0.5)",
    margin: (width * 0.1 - 8) / 2, // 각 요소 사이의 간격 조정
    borderRadius: 10, // 디자인 향상을 위한 라운드 처리.
  },
  widgetBoxforAdd: {
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(50, 50, 50, 0.05)",
    width: itemWidth,
    height: 200, // height는 width와 동일하게 설정
    margin: (width * 0.05 - 8) / 2, // 각 요소 사이의 간격 조정
    borderRadius: 10, // 디자인 향상을 위한 라운드 처리
  },
  animatedBox: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(0,0,0,0.2)", // 혹은 원하는 색상
    position: "absolute",
    top: "10%",
    left: "10%",
  },
  modalContainer: {
    width: 300,
    height: 400,
    backgroundColor: "white",
    padding: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
  },
  closeButtonText: {
    fontSize: 16,
    color: "red",
  },
  todayTodoButton: {
    backgroundColor: "#F1F1F1",
    padding: 10,
    borderRadius: 5,
    margin: 5,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: "rgba(200,200,200,0.2)", // 회색 톤 배경
  },
  disabledButtonText: {
    color: "rgba(0,0,0,0.3)", // 흐린 글씨 색상
  },
  pastButtonActive: {
    // 버튼 활성화 시 스타일
    borderWidth: 1,
    borderColor: "#000", // 진한 테두리 색상
  },
  pastButtonInactive: {
    // 버튼 비활성화 시 스타일
    borderWidth: 1,
    borderColor: "#aaa", // 흐린 테두리 색상
  },
  pastButtonTextActive: {
    // 텍스트 활성화 시 스타일
    color: "#000", // 진한 글씨 색상
  },
  pastButtonTextInactive: {
    // 텍스트 비활성화 시 스타일
    color: "#aaa", // 흐린 글씨 색상
  },
  scrollViewStyle: {
    maxHeight: "100%", // 스크롤 뷰의 최대 높이 설정
  },
  //Last Add Button
  circleWrapper: {
    width: 70, // 원하는 너비 설정
    height: 70, // 원하는 높이 설정
    borderRadius: 100, // 동그랗게 만들기 위한 반지름 설정
    backgroundColor: "rgba(245, 245, 245, 1)", // 배경색 설정.
    justifyContent: "center",
    alignItems: "center",
    position: "absolute", // 이 부분을 추가합니다.
    top: "50%", // 상위 컨테이너의 중앙에 위치시키기 위해 추가합니다.
    left: "50%", // 상위 컨테이너의 중앙에 위치시키기 위해 추가합니다.
    zIndex: 10, // zIndex 추가
    transform: [{ translateX: -35 }, { translateY: -35 }],
  },
  squareWrapper: {
    width: 50,
    height: 50,
    backgroundColor: "rgba(245, 245, 245, 1)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
    left: "50%",
    zIndex: 10, // zIndex 추가
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
});
