import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from "react-native";

import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import ScheduleTab from "./ScheduleTab";
import BusyCheckingTab from "./BusyCheckingTab";
import BusyShowingTab from "./BusyShowingTab";
import * as Notifications from "expo-notifications";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../Redux/selector";

//동기화용.

//한 달의 날짜 배열을 생성하는 함수라고 보면 된다.
//ex) 9월 = [null, null, 1, 2, 3 ...]
function generateCalendar(year, month) {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const dates = [];
  for (let i = 1; i <= endDate.getDate(); i++) {
    dates.push(i);
  }

  const startPadding = startDate.getDay();
  for (let i = 0; i < startPadding; i++) {
    dates.unshift(null);
  }

  const weeksRequired = Math.ceil((startPadding + endDate.getDate()) / 7);

  // 필요한 주의 수만큼 표시
  while (dates.length < weeksRequired * 7) {
    dates.push(null);
  }

  return dates;
}

export default function Calendar(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectmodalVisible, setSelectModalVisible] = useState(false);
  const [busycheckmodalVisible, setBusycheckModalVisible] = useState(false);
  const [busyshowmodalVisible, setBusyshowModalVisible] = useState(false);

  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth());
  const [dates, setDates] = useState([]);

  const [data, setData] = useState([]); //일정 데이터가 담길 변수
  const [datedata, setDatedata] = useState("0000-00-00"); //년도-월-일 데이터가 담길 변수
  const [daydata, setDaydata] = useState(""); //일자 데이터
  const [content, setContent] = useState(""); //내용 데이터

  const [qualification, setQualification] = useState(false);
  const [qualificationalarm, setQualificationAlarm] = useState(false);

  const position = useRef(new Animated.Value(0)).current; // 옆으로 넘어가게 하기위한 변수
  const cellRefs = useRef([]); //드래그시, 셀들이 선택되는 것을 방지

  const [currentUserName, setCurrentUserName] = useState("");

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 31 }, (_, index) =>
    (currentYear - 15 + index).toString()
  );
  const [selectedyear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedmonth, setSelectedMonth] = useState(currentDate.getMonth());

  const [busyCount, setBusyCount] = useState(0);
  const [notbusyCount, setNotBusyCount] = useState(0);
  const [noneCount, setNoneCount] = useState(0);

  async function schedulePushNotification() {
    const currentUser = firebase.auth().currentUser;

    const expoPushTokenRef = db.collection("users")
      .doc(currentUser.email)
      .collection("Token")
      .doc("Token")
      .get();

    const expoPushToken = (await expoPushTokenRef).data().token;

    const userNameRef = db.collection("users")
    .doc(currentUser.email).get()

    const userName = (await userNameRef).data().UserName;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // 다음 날로 설정
    tomorrow.setHours(9, 0, 0); // 오전 9시로 시간 설정

    console.log(expoPushToken, tomorrow);

    await Notifications.scheduleNotificationAsync({
      content: {
        to: expoPushToken,
        sound: "default",
        title: "테스트 알림",
        body: userName + "님, 내일 일정입니다.",
        data: { someData: "여기 데이터를 넣으시오" },
      },
      trigger: tomorrow,
    });
  }

  //폰트 크기/두께 가져오기
  const [fontSize, setFontSize] = useState(10); // 초기값을 설정합니다.
  const [fontWeight, setFontWeight] = useState("400");
  const [scheduleHeight, setScheduleHeight] = useState(11);

  const setName = async () => {
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      try {
        const userDoc = await db
          .collection("users")
          .doc(currentUser.email)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();

          // Set the states based on the fetched data
          setCurrentUserName(userData.UserName);
          setFontSize(userData.fontsize);
          setFontWeight(userData.fontWeight);
          setScheduleHeight(userData.scheduleheight);

          console.log("User data:", userData);
        } else {
          console.log("No user data found for:", currentUser.email);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  };

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  //일정 색상 지정하기
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
  const [selectedColor, setSelectedColor] = useState("rgba(200, 200, 200, 1)"); // 기본 색상

  //파이어베이스 접근 변수
  const db = firebase.firestore();
  const currentUser = firebase.auth().currentUser;

  const [busyIconColor, setBusyIconColor] = useState('grey');

  //일정 추가 토글 버튼
  const [additionalButtonsVisible, setAdditionalButtonsVisible] =
    useState(false);

  const toggleAdditionalButtons = () => {
    setAdditionalButtonsVisible(!additionalButtonsVisible);
  };

  //눌렀을 때 날짜 확인
  function handleDatePress(date) {
    const formattedMonth = month < 9 ? `0${month + 1}` : `${month + 1}`;
    const formattedDate = date < 10 ? `0${date}` : `${date}`;
    console.log(`${year}-${formattedMonth}-${formattedDate}`);
  }

  //월별 이동 구현하기********************************************************************************
  function prevMonth() {
    setMonth((prevMonth) => {
      if (prevMonth === 0) {
        setYear((prevYear) => prevYear - 1);
        return 11;
      } else {
        return prevMonth - 1;
      }
    });
  }

  function nextMonth() {
    setMonth((prevMonth) => {
      if (prevMonth === 11) {
        setYear((prevYear) => prevYear + 1);
        return 0;
      } else {
        return prevMonth + 1;
      }
    });
  }

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: position } }],
    { useNativeDriver: true }
  );
  const onHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      if (nativeEvent.translationX > 100) {
        prevMonth();
        position.setValue(0); // 캘린더 위치 초기화
      } else if (nativeEvent.translationX < -100) {
        nextMonth();
        position.setValue(0); // 캘린더 위치 초기화
      } else {
        Animated.spring(position, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  // 투명도와 크기를 조절하기 위한 인터폴레이션
  const rightArrowOpacity = position.interpolate({
    inputRange: [-100, 0], // <- 여기서 -50은 사용자가 왼쪽으로 최소 50 픽셀 드래그 할 때 '>' 아이콘이 가장 진하게 보이도록 설정한 값입니다.
    outputRange: [1, 0], // 완전히 드래그되지 않았을 때는 보이지 않고, 왼쪽으로 50 픽셀 이상 드래그 되면 완전히 보입니다.
    extrapolate: "clamp",
  });

  const leftArrowOpacity = position.interpolate({
    inputRange: [0, 100], // 오른쪽으로 50 픽셀 드래그 할 때 '<' 아이콘이 가장 진하게 보이도록 설정한 값입니다.
    outputRange: [0, 1], // 완전히 드래그되지 않았을 때는 보이지 않고, 오른쪽으로 50 픽셀 이상 드래그 되면 완전히 보입니다.
    extrapolate: "clamp",
  });

  const arrowScale = position.interpolate({
    inputRange: [-100, -50, 0, 50, 100],
    outputRange: [2.5, 1.5, 1, 1.5, 2.5], // -50에서와 50에서 2배 크기, 0에서는 1배 크기로
    extrapolate: "clamp",
  });

  const arrowColor = position.interpolate({
    inputRange: [-100, 0, 100],
    outputRange: ["rgba(0,0,0,1)", "rgba(0,0,0,0.5)", "rgba(0,0,0,1)"],
    extrapolate: "clamp",
  });

  const getqualification = async () => {
    if (props.selectedGroup !== "My Calendar") {
      const docRef1 = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .doc(currentUser.email)
        .get();

      const powerdata = docRef1.data().power;
      console.log("Calendar, ", powerdata);

      const docRef2 = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .doc(powerdata)
        .get();

      const qualificationdata = docRef2.data().Schedule;
      const qualificationalarmdata = docRef2.data().Alarm; //알림 요청 권한
      setQualification(qualificationdata);
      setQualificationAlarm(qualificationalarmdata);
      console.log("일정 권한: ", qualification);
    }
  };

  //*************************************************일정 등록 함수
  const registerSchedule = async (selecteddate, content, color) => {
    const userNameRef = db.collection("users")
    .doc(currentUser.email)
    .get()

    const userName = (await userNameRef).data().UserName;

    const scheduleData = {
      date: selecteddate,
      content: content,
      color: color,
      writer: userName,
    };

    const docId = `${selecteddate}_${content}`;

    let docRef; // 문서의 참조를 저장할 변수

    // "My Calendar"인 경우
    if (props.selectedGroup === "My Calendar") {
      docRef = db
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("일정")
        .doc(docId);
    }
    // 그 외의 경우 (Group calendar)
    else {
      docRef = db
        .collection("Group calendar")
        .doc(props.selectedGroup) // 선택된 그룹을 문서 ID로 사용
        .collection("일정")
        .doc(docId);
    }

    // 일정 데이터 설정
    return docRef.set(scheduleData).catch((error) => {
      console.error("Error writing document: ", error);
    });
  };

  //*************************************************일정 불러오기
  const fetchSchedulesForMonth = async (yearMonth) => {
    const currentUser = firebase.auth().currentUser;
    //로딩창 시도.

    if (currentUser) {
      let schedules = [];

      const startRange = yearMonth;
      const endRange = `${yearMonth.split("-")[0]}-${(
        parseInt(yearMonth.split("-")[1]) + 1
      )
        .toString()
        .padStart(2, "0")}`;

      let query;
      let togetherGroups = [];

      if (props.selectedGroup === "My Calendar") {
        query = db
          .collection("users")
          .doc(currentUser.email)
          .collection("일정")
          .where(firebase.firestore.FieldPath.documentId(), ">=", startRange)
          .where(firebase.firestore.FieldPath.documentId(), "<", endRange);

        const userGroupsSnapshot = await db.collection("users")
          .doc(currentUser.email)
          .collection("Group")
          .get();
        
        userGroupsSnapshot.forEach(doc => {
          let groupData = doc.data();
          if (groupData.isTogether) {
            togetherGroups.push(doc.id);
          }
        });
      } else {
        // Group calendar
        query = db
          .collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("일정")
          .where(firebase.firestore.FieldPath.documentId(), ">=", startRange)
          .where(firebase.firestore.FieldPath.documentId(), "<", endRange);
      }

      // Execute the '일정' query
      try {
        const querySnapshot = await query.get();
        querySnapshot.forEach((doc) => {
          let data = doc.data();
          schedules.push({
            date: data.date,
            content: data.content,
            color: data.color,
            isGroup: false,
            writer: data.writer
          });
        });

        togetherGroups.map(async (groupId) => {
          const groupQuery = db
            .collection("Group calendar")
            .doc(groupId)
            .collection("일정")
            .where(firebase.firestore.FieldPath.documentId(), ">=", startRange)
            .where(firebase.firestore.FieldPath.documentId(), "<", endRange);
      
          const groupQuerySnapshot = await groupQuery.get();
          groupQuerySnapshot.forEach(doc => {
            let data = doc.data();
            schedules.push({
              date: data.date,
              content: data.content,
              color: data.color,
              isGroup: true,
              writer: data.writer
            });
          });
        });
      } catch (error) {
        console.error("Error fetching schedules: ", error);
      }

      let collectionPath;
      if (props.selectedGroup === "My Calendar") {
        collectionPath = db.collection("users").doc(currentUser.email);
      } else {
        collectionPath = db
          .collection("Group calendar")
          .doc(props.selectedGroup);
      }

      // Fetch '반복일정' data
      const collectionNamesSnapshot = await collectionPath
        .collection("반복일정폴더")
        .get();
      const collections = collectionNamesSnapshot.docs.map((doc) => ({
        name: doc.id,
        color: doc.data().color,
      }));

      // Process 'monthly' data
      const monthlyPromises = collections.map(async (collection) => {
        const monthlyDocsSnapshot = await collectionPath
          .collection("반복일정")
          .doc("monthly")
          .collection(collection.name)
          .get();
        monthlyDocsSnapshot.forEach((doc) => {
          let data = doc.data();
          schedules.push({
            date: `${yearMonth}-${data.date}`,
            content: data.text,
            color: collection.color,
            isGroup: false,
            writer: data.writer
          });
        });
      });

      // Process 'yearly' data
      const yearlyPromises = collections.map(async (collection) => {
        const yearlyDocsSnapshot = await collectionPath
          .collection("반복일정")
          .doc("yearly")
          .collection(collection.name)
          .get();
        yearlyDocsSnapshot.forEach((doc) => {
          const fullID = doc.id.split("_");
          const monthDay = fullID[0].split("-");
          if (monthDay[0] === yearMonth.split("-")[1]) {
            let data = doc.data();
            schedules.push({
              date: `${yearMonth}-${monthDay[1]}`,
              content: data.text,
              color: collection.color,
              isGroup: false,
              writer: data.writer
            });
          }
        });
      });

      // Wait for all queries to complete
      await Promise.all([...monthlyPromises, ...yearlyPromises]);

      return schedules;
    }
  };

  //일정을 다음과 같이 그룹화를 하여야한다.
  function groupByDate(schedules) {
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      return schedules.reduce((acc, schedule) => {
        if (!acc[schedule.date]) {
          acc[schedule.date] = [];
        }
        // content와 color 모두를 포함하는 객체를 배열에 추가
        acc[schedule.date].push({
          content: schedule.content,
          color: schedule.color,
          isGroup: schedule.isGroup,
          writer: schedule.writer,
        });
        return acc;
      }, {});
    }
  }

  //*************************************************일정 삭제 함수
  const deleteSchedule = async (selecteddate, content) => {
    const docId = `${selecteddate}_${content}`;

    if (props.selectedGroup === "My Calendar") {
      const docRef = db
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("일정")
        .doc(docId);

      // 문서를 삭제합니다.
      await docRef.delete();

      // 삭제 후 데이터를 업데이트합니다.
      const formattedMonth = month < 9 ? `0${month + 1}` : `${month + 1}`;
      const updatedSchedules = await fetchSchedulesForMonth(
        `${year}-${formattedMonth}`
      );
      const groupedSchedules = groupByDate(updatedSchedules);
      setData(groupedSchedules);
    } else {
      const docRef = db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("일정")
        .doc(docId);

      // 문서를 삭제합니다.
      await docRef.delete();

      const logRef = db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("로그")
        .doc(selecteddate + "_" + currentUserName + "_" + content);

      // 문서를 삭제합니다.
      await logRef.delete();

      // 삭제 후 데이터를 업데이트합니다.
      const formattedMonth = month < 9 ? `0${month + 1}` : `${month + 1}`;
      const updatedSchedules = await fetchSchedulesForMonth(
        `${year}-${formattedMonth}`
      );
      const groupedSchedules = groupByDate(updatedSchedules);
      setData(groupedSchedules);
    }
  };

  // const [signatureStyles, setSignatureStyles] = useState(getSignatureStyles());
  //일정 불러오기 UseEffect
  useEffect(() => {
    // 캘린더를 생성합니다.
    setDates(generateCalendar(year, month));

    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      //schedulePushNotification();
      setName();

      const formattedMonth = month < 9 ? `0${month + 1}` : `${month + 1}`;

      fetchSchedulesForMonth(`${year}-${formattedMonth}`)
        .then((fetchedSchedules) => {
          const groupedSchedules = groupByDate(fetchedSchedules);
          setData(groupedSchedules);
        })
        .catch((error) => {
          console.error("Error fetching schedules: ", error);
        });

      getqualification();
      console.log("Calendar, 무한 재귀 방지용");
    } else {
      setData([]);
    }
  }, [year, month, currentUser, props.selectedGroup]); //<- data를 넣었을 때 무한 반복 오류.

  //로그에 등록하는 함수.
  const registerLog = async (selecteddate, content) => {
    if (props.selectedGroup !== "My Calendar")
      db.collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("로그")
        .doc(selecteddate + "_" + currentUserName + "_" + content) //날짜_작성자_일정내용
        .set({
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          name: currentUserName,
          content: "일정: " + content,
          date: selecteddate,
        });
  };

  const adjustedHeight =
    Platform.OS === "android" ? scheduleHeight + 3 : scheduleHeight;

  const fetchBusyMemberCount = async () => {
    try {
      // 그룹원 컬렉션에서 문서들을 가져옵니다.
      const groupMembersSnapshot = await db.collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .get();
  
      let busyCount = 0;
      let notbusyCount = 0;
      let noneCount = 0;
  
      // 각 그룹원 문서에 대해 반복합니다.
      for (const doc of groupMembersSnapshot.docs) {
        const memberId = doc.id;
  
        // 해당 날짜의 busy 문서에 접근합니다.
        const busyDoc = await db.collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("그룹원")
          .doc(memberId)
          .collection(datedata)
          .doc(datedata)
          .get();
  
        if (busyDoc.exists) {
          if(busyDoc.data().busy) {
            busyCount++; // busy 상태인 경우 카운트를 증가시킵니다.
          }else {
            notbusyCount++; // busy 상태인 경우 카운트를 증가시킵니다.
          }
        }else{
          noneCount++;
        }
      }
  
      setBusyCount(busyCount);
      setNotBusyCount(notbusyCount);
      setNoneCount(noneCount);
    } catch (error) {
      console.error("Error fetching busy member count:", error);
    }
  };

  useEffect(() => {
    fetchBusyMemberCount();
  }, [datedata])

  return (
    <>
      <View>
        {/* 월, 요일 표시할 헤더, 달력 상단부. */}
        <View
          style={[styles.header, signatureStyles ? signatureStyles.topbar : {}]}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectModalVisible(true);
            }}
          >
            <Text
              style={[
                styles.dateLabel,
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              {year}. {month + 1}.
            </Text>
          </TouchableOpacity>
        </View>
        <View
          style={[styles.dayBar, signatureStyles ? signatureStyles.topbar : {}]}
        >
          {["sun", "mon", "tue", "wed", "thu", "fri", "sat"].map(
            (day, index) => (
              <View key={index} style={styles.dayCell}>
                <Text
                  style={[
                    styles.dayLabel,
                    signatureStyles ? signatureStyles.Textcolor : {},
                    (index === 0 || index === 6) && styles.redText,
                  ]}
                >
                  {day}
                </Text>
              </View>
            )
          )}
        </View>
      </View>

      <Modal
        transparent={true}
        visible={selectmodalVisible}
        onRequestClose={() => {
          setSelectModalVisible(!selectmodalVisible);
        }}
      >
        <View style={[styles.centeredView]}>
          <View style={styles.dateMover}>
            <Picker
              selectedValue={selectedyear}
              style={styles.pickyYear}
              itemStyle={{ fontSize: 14, height: "100%" }}
              onValueChange={(itemValue) =>
                setSelectedYear(parseInt(itemValue, 10))
              }
            >
              {years.map((year) => (
                <Picker.Item
                  key={year}
                  label={year}
                  value={parseInt(year, 10)}
                />
              ))}
            </Picker>

            <Picker
              selectedValue={selectedmonth + 1}
              style={styles.pickmonth}
              itemStyle={{ fontSize: 14, height: "100%" }}
              onValueChange={(itemValue) =>
                setSelectedMonth(parseInt(itemValue, 10) - 1)
              }
            >
              {Array.from({ length: 12 }, (_, i) =>
                (i + 1).toString().padStart(2, "0")
              ).map((month) => (
                <Picker.Item
                  key={month}
                  label={month}
                  value={parseInt(month, 10)}
                />
              ))}
            </Picker>
            <View
              style={{
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setYear(currentDate.getFullYear());
                  setMonth(currentDate.getMonth());
                  setSelectModalVisible(!selectmodalVisible);
                }}
                style={styles.movebutton}
              >
                <Text>Today</Text>
              </TouchableOpacity>
              <View style={{ padding: 5 }}></View>
              <TouchableOpacity
                onPress={() => {
                  setYear(selectedyear);
                  setMonth(selectedmonth);
                  setSelectModalVisible(!selectmodalVisible);
                }}
                style={styles.movebutton}
              >
                <Text>이동</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        {...cellRefs.current.map((ref) => ({ waitFor: ref }))}
      >
        {/* 날짜, 데이터가 표시될 달력 하단부. */}
        <Animated.View
          style={[
            styles.calendar,
            signatureStyles ? signatureStyles.field : {},
            {
              transform: [{ translateX: position }],
            },
          ]}
        >
          {/* 일정 데이터를 등록할 수 있는 모달 창. */}
          <Modal
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => {
              setModalVisible(!modalVisible);
            }}
          >
            <View style={styles.centeredView}>
              <View style={styles.modalView}>
                <View style={{ width: "100%", height: "80%" }}>
                  {/* 해당 날짜 표시. */}
                  <View
                    style={[
                      {
                        flexDirection: "row", // 수평 정렬
                        alignItems: "center", // 아이템들을 세로 중앙에 배치
                        backgroundColor: "lightgray", // 배경색 설정
                        borderRadius: 0,
                        padding: 10,
                        justifyContent: "space-between",
                      },
                      signatureStyles ? signatureStyles.footer : {},
                    ]}
                  >
                    <Text
                      style={[
                        {
                          justifyContent: "flex-start",
                          fontSize: 18,
                          paddingLeft: 16,
                        },
                        signatureStyles ? signatureStyles.Textcolor : {},
                      ]}
                    >
                      {datedata}
                    </Text>

                    {/* My Calendar일 때만 바쁨 on/off 버튼. */}
                    <View style={{ flexDirection: "row", }}>
                      {props.selectedGroup !== "My Calendar" && (
                        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center"}}>
                          <View
                            style={{
                                width: 15,
                                height: 15,
                                borderRadius: 12,
                                backgroundColor: '#00FF40'
                            }} />
                          <Text style={{ marginHorizontal: 5, }}>{notbusyCount}</Text>
                          <View
                          style={{
                              width: 15,
                              height: 15,
                              borderRadius: 12,
                              backgroundColor: 'red'
                          }} />
                          <Text style={{ marginHorizontal: 5, }}>{busyCount}</Text>
                          <View
                          style={{
                              width: 15,
                              height: 15,
                              borderRadius: 12,
                              backgroundColor: 'grey'
                          }} />
                          <Text style={{ marginHorizontal: 5, }}>{noneCount}</Text>
                        </View>
                      )}
                      {props.selectedGroup === "My Calendar" && (
                        <TouchableOpacity 
                          onPress={() => {
                            setBusycheckModalVisible(!busycheckmodalVisible);
                          }}>
                          <Icon
                            name="circle" // 예시 아이콘, 실제 아이콘은 상황에 맞게 변경
                            size={25}
                            color={busyIconColor}
                          />
                        </TouchableOpacity>
                      )}

                      {props.selectedGroup !== "My Calendar" && (
                        <TouchableOpacity 
                          onPress={() => {
                            setBusyshowModalVisible(!busyshowmodalVisible);
                          }}>
                          <Icon
                            name="directions-walk" // 예시 아이콘, 실제 아이콘은 상황에 맞게 변경
                            size={25}
                            color="#000"
                            style={[signatureStyles ? signatureStyles.Textcolor : {}]}
                          />
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={{ marginLeft: 10, }}
                        onPress={() => {
                          setModalVisible(!modalVisible);
                          setAdditionalButtonsVisible(false);
                        }}
                      >
                        <Icon
                          name="close"
                          size={25}
                          style={[
                            signatureStyles ? signatureStyles.Textcolor : {},
                          ]}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Modal
                    transparent={true}
                    visible={busycheckmodalVisible}
                    onRequestClose={() => {
                      setBusycheckModalVisible(!busycheckmodalVisible);
                    }}
                  >
                    <View style={styles.busycenteredView}>
                      <View style={styles.busymodalView}>
                        <View
                          style={[
                            {
                              flexDirection: "row", // 수평 정렬
                              alignItems: "center", // 아이템들을 세로 중앙에 배치
                              backgroundColor: "lightgray", // 배경색 설정
                              borderRadius: 0,
                              padding: 10,
                              justifyContent: "space-between",
                            },
                            signatureStyles ? signatureStyles.footer : {},
                          ]}
                        >
                            {/* 모달창 닫기 버튼 */}
                            <TouchableOpacity
                                style={[
                                  {
                                    alignItems: "flex-end"
                                  },
                                  signatureStyles ? signatureStyles.Textcolor : {},
                                ]}
                                onPress={() => {
                                  setBusycheckModalVisible(!busycheckmodalVisible);
                                }}
                            >
                                <Icon 
                                  name="arrow-back" 
                                  size={25} 
                                  color="#000"
                                  style={[signatureStyles ? signatureStyles.Textcolor : {}]} 
                                />
                            </TouchableOpacity>

                            <Text style={[styles.modalText, signatureStyles ? signatureStyles.Textcolor : {},]}>상태 표시</Text>
                            <View style={{ width: 28 }}></View>
                        </View>

                        <BusyCheckingTab datedata={datedata}/>
                      </View>
                    </View>
                  </Modal>

                  <Modal
                    transparent={true}
                    visible={busyshowmodalVisible}
                    onRequestClose={() => {
                      setBusyshowModalVisible(!busyshowmodalVisible);
                    }}
                  >
                    <View style={styles.busycenteredView}>
                      <View style={styles.busymodalView}>
                        <View
                          style={[
                            {
                              flexDirection: "row", // 수평 정렬
                              alignItems: "center", // 아이템들을 세로 중앙에 배치
                              backgroundColor: "lightgray", // 배경색 설정
                              borderRadius: 0,
                              padding: 10,
                              justifyContent: "space-between",
                            },
                            signatureStyles ? signatureStyles.footer : {},
                          ]}
                        >
                            {/* 모달창 닫기 버튼 */}
                            <TouchableOpacity
                                style={[
                                  {
                                    alignItems: "flex-end"
                                  },
                                  signatureStyles ? signatureStyles.Textcolor : {},
                                ]}
                                onPress={() => {
                                  setBusyshowModalVisible(!busyshowmodalVisible);
                                }}
                            >
                                <Icon 
                                  name="arrow-back" 
                                  size={25} 
                                  color="#000"
                                  style={[signatureStyles ? signatureStyles.Textcolor : {}]} 
                                />
                            </TouchableOpacity>

                            <Text style={[styles.modalText, signatureStyles ? signatureStyles.Textcolor : {},]}>상태 표시</Text>
                            <View style={{ width: 28 }}></View>
                        </View>

                        <BusyShowingTab selectedGroup={props.selectedGroup} datedata={datedata}/>
                      </View>
                    </View>
                  </Modal>

                  <View style={styles.customUnderline} />

                  {/* 해당 날짜의 일정들, 삭제 버튼. */}
                  <ScrollView style={{ width: "100%", height: "auto" }}>
                    {data[
                      `${year}-${
                        month < 9 ? `0${month + 1}` : `${month + 1}`
                      }-${daydata < 10 ? `0${daydata}` : `${daydata}`}`
                    ] &&
                      data[
                        `${year}-${
                          month < 9 ? `0${month + 1}` : `${month + 1}`
                        }-${daydata < 10 ? `0${daydata}` : `${daydata}`}`
                      ].map(({ content, color, isGroup, writer }, index) => (
                        <View
                          key={index}
                          style={{
                            paddingHorizontal: 10,
                            width: "100%",
                            flexDirection: "row",
                            height: props.selectedGroup === "My Calendar" ? 48 : 70,
                            alignItems: "center",
                            justifyContent: "space-between",
                            borderBottomWidth: 0.5, // 밑줄의 굵기
                            borderBottomColor: "#eee", // 밑줄의 색상
                          }}
                        >
                          <ScheduleTab
                            content={content}
                            writer={writer}
                            isGroup={isGroup}
                            datedata={datedata}
                            selectedGroup={props.selectedGroup}
                            alarmauthority={qualificationalarm} //알림 요청 권한 넘겨줌.
                          />

                          {!isGroup && (
                            <TouchableOpacity
                              style={styles.delete}
                              onPress={() => {
                                if (props.selectedGroup === "My Calendar") {
                                  deleteSchedule(datedata, content);
                                } else {
                                  if (qualification === false) {
                                    Alert.alert("권한 알림", "일정 삭제 권한이 없습니다.");
                                  } else {
                                    deleteSchedule(datedata, content);
                                  }
                                }
                              }}
                            >
                              <Text style={{ fontSize: 13 }}>삭제</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      ))}
                  </ScrollView>
                </View>

                <View style={{ width: "100%", alignItems: "center" }}>
                  {/* 일정 추가를 위한 토글 버튼. */}
                  <TouchableOpacity
                    style={[
                      styles.registerschedule,
                      signatureStyles ? signatureStyles.footer : {},
                    ]}
                    onPress={() => {
                      if (props.selectedGroup === "My Calendar") {
                        toggleAdditionalButtons();
                      } else {
                        if (qualification === false) {
                          Alert.alert("권한 알림", "일정 등록 권한이 없습니다.");
                        } else {
                          toggleAdditionalButtons();
                        }
                      }
                    }}
                  >
                    <Icon
                      name="event"
                      size={24}
                      color="#000"
                      style={[signatureStyles ? signatureStyles.Textcolor : {}]}
                    />
                  </TouchableOpacity>

                  {additionalButtonsVisible && (
                    <View
                      // 반응형인지 잘 모르겠음 확인 해봐야함.
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-evenly",
                        alignItems: "center",
                        position: "absolute",
                        marginTop: 10,
                        bottom: "75%",
                        marginBottom: 30,
                        width: "100%",
                        marginHorizontal: 10,
                      }}
                    >
                      <TextInput
                        style={styles.textinput}
                        placeholder="  ..."
                        onChangeText={(content) => setContent(content)}
                        autoCorrect={false}
                      />
                      <TouchableOpacity
                        onPress={() => setShowColorPalette(!showColorPalette)}
                      >
                        <View
                          style={{
                            width: 24,
                            height: 24,
                            backgroundColor: selectedColor,
                          }}
                        />
                      </TouchableOpacity>
                      {showColorPalette && (
                        <View
                          style={{
                            backgroundColor: "rgba(120,120,120,0.1)",
                            position: "absolute",
                            right: "23.5%",
                            bottom: 40,
                            flexDirection: "column",
                            borderColor: "black",
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
                                setSelectedColor(color);
                                setShowColorPalette(false);
                              }}
                            />
                          ))}
                        </View>
                      )}
                      <View style={{ padding: 5 }}></View>

                      {/* 일정 등록 버튼 */}
                      <TouchableOpacity
                        style={[styles.register]}
                        onPress={() => {
                          registerLog(datedata, content);
                          registerSchedule(datedata, content, selectedColor) // 여기에서 selectedColor를 추가
                            .then(() => {
                              const formattedMonth =
                                month < 9 ? `0${month + 1}` : `${month + 1}`;
                              return fetchSchedulesForMonth(
                                `${year}-${formattedMonth}`
                              );
                            })
                            .then((fetchedSchedules) => {
                              const groupedSchedules =
                                groupByDate(fetchedSchedules);
                              setData(groupedSchedules);
                            })
                            .catch((error) => {
                              console.error(
                                "Error after schedule registration: ",
                                error
                              );
                            });
                          setModalVisible(!modalVisible);
                          setAdditionalButtonsVisible(false);
                        }}
                      >
                        <Icon name="add-circle" size={32} color="#000" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </Modal>

          {/* 이 부분이 날짜, 데이터 표시하는 cell 부분. */}
          {dates.map((date, index) => (
            // 각각의 셀 만들기
            <TouchableOpacity
              ref={(ref) => (cellRefs.current[index] = ref)}
              key={index}
              style={[styles.cell, signatureStyles ? signatureStyles.grid : {}]}
              onPress={() => {
                date && handleDatePress(date);
                setModalVisible(!modalVisible);
                fetchBusyMemberCount();
                setDatedata(
                  `${year}-${month < 9 ? `0${month + 1}` : `${month + 1}`}-${
                    date < 10 ? `0${date}` : `${date}`
                  }`
                );
                setDaydata(date);
              }}
            >
              {date && (
                //각각의 날자 넣기
                <View>
                  
                  <Text
                    style={[
                      styles.dateText,
                      signatureStyles ? signatureStyles.Textcolor : {},
                      index % 7 === 0 || index % 7 === 6 ? styles.redText : null,
                    ]}
                  >
                    {date}
                  </Text>
                </View>
              )}
              {/* 일정 넣기 */}
              {data[
                `${year}-${month < 9 ? `0${month + 1}` : `${month + 1}`}-${
                  date < 10 ? `0${date}` : `${date}`
                }` //날자 문자열 생성
              ] &&
                data[
                  `${year}-${month < 9 ? `0${month + 1}` : `${month + 1}`}-${
                    date < 10 ? `0${date}` : `${date}`
                  }` //데이터에서 해당 날자의 일정 가져오기
                ].map(({ content, color }, index) => (
                  <View
                    key={index} // key는 항상 최상위 엘리먼트에 있어야 합니다.
                    style={[
                      {
                        overflow: "hidden",
                        backgroundColor: color || "rgba(100, 128, 128, 0.1)",
                        width: "100%",
                        height: adjustedHeight, // 이 부분 안드로이드, ios 반응형으로 변경 필요.
                        justifyContent: "center",
                        marginBottom: 3,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: fontSize,
                        fontWeight: fontWeight,
                      }}
                    >
                      {content}
                    </Text>
                  </View>
                ))}
            </TouchableOpacity>
          ))}

          {/* '<' 표시 추가 */}
          <Animated.Text
            style={{
              position: "absolute",
              left: -50, // 적당한 위치에 '<' 아이콘 위치 조절
              color: arrowColor,
              opacity: leftArrowOpacity,
              zIndex: 1, // 다른 요소 위에 표시되게 함
              transform: [{ scale: arrowScale }],
            }}
          >
            {"<"}
          </Animated.Text>
          {/* '>' 표시 추가 */}
          <Animated.Text
            style={{
              position: "absolute",
              right: -50, // 오른쪽 위치 조절
              color: arrowColor,
              opacity: rightArrowOpacity,
              zIndex: 1, // 다른 요소 위에 표시되게 함
              transform: [{ scale: arrowScale }],
            }}
          >
            {">"}
          </Animated.Text>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
}
const styles = StyleSheet.create({
  //드로워 관련
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 84,
    backgroundColor: "black",
  },
  modalOverlay: {
    position: "absolute", // 위치를 절대값으로 설정
    top: 0, // 상단에서 0만큼 떨어진 위치에 배치
    left: 0, // 좌측에서 0만큼 떨어진 위치에 배치
    width: "100%", // 넓이를 100%로 설정하여 전체 화면을 차지하도록 함
    height: "100%", // 높이도 100%로 설정하여 전체 화면을 차지하도록 함
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    justifyContent: "center",
    width: Dimensions.get("window").width * 0.4,
    height: "100%",
    backgroundColor: "white",
  },
  flatListStyle: {
    top: 30,
    padding: 10,
  },

  dateLabel: {
    fontSize: 30, // 글자 크기
    fontWeight: "bold", // 글자 두께
    color: "#FFFFFF", // 흰색 글자
    shadowColor: "black",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  //달력 그리드
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,1)",
  },
  cell: {
    width: "14.285714285714286%", // 100 / 7 (7 days in a week)
    height: 90,
    overflow: "hidden",
    justifyContent: "flex-start", // Align vertically to the top
    alignItems: "flex-end", // Align horizontally to the right
    borderWidth: 0.5,
    borderColor: "rgba(220,220,220,1)",
    padding: 2,
    //paddingRight: 4, // Padding on the right
    paddingTop: 1, // Padding on the top
  },
  //텍스트 스타일
  contentText: {
    //width: "100%", // 이 부분을 추가
    //height: 11,
    // backgroundColor: "yellow",
    fontSize: 10,
    padding: 0, // 약간의 패딩을 추가하여 내용이 더 잘 보이도록 합니다.
    //borderRadius: 5, // 노란색 배경에 약간의 둥근 모서리를 추가합니다.
    // marginTop: 1, // 날짜와 일정 내용 사이에 약간의 간격을 줍니다.
    overflow: "hidden", // 둥근 모서리 스타일이 제대로 적용되도록 합니다.
  },
  //텍스트 스타일
  contentText2: {
    width: "auto", // 이 부분을 추가
    fontSize: 9,
    padding: 0, // 약간의 패딩을 추가하여 내용이 더 잘 보이도록 합니다.
    //borderRadius: 5, // 노란색 배경에 약간의 둥근 모서리를 추가합니다.
    marginTop: 1, // 날짜와 일정 내용 사이에 약간의 간격을 줍니다.
    overflow: "hidden", // 둥근 모서리 스타일이 제대로 적용되도록 합니다.
  },
  dateText: {
    shadowColor: "black",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 1,
    fontSize: 14,
  },
  //요일 표시바
  dayBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 20,
    backgroundColor: "rgba(255,255,255,1)",
  },
  dayCell: {
    width: "14.285714285714286%", // 100 / 7 (7 days in a week)
    justifyContent: "center",
    alignItems: "center",
  },
  dayLabel: {
    fontSize: 12,
  },
  redText: {
    color: "red",
  },
  //상단 월별 이동 바
  header: {
    zIndex: 1, // zIndex 추가
    paddingTop: 5,
    paddingLeft: 10,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    // iOS 그림자
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    // Android 그림자
    elevation: 5,
  },
  dateLabel: {
    fontSize: 18,
    fontWeight: "500",
  },
  //모달 창
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  busycenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    //borderRadius: 20,
    width: "90%",
    height: 500,
    padding: 0,
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,

    justifyContent: "space-between",
  },
  busymodalView: {
    margin: 20,
    backgroundColor: "white",
    //borderRadius: 20,
    width: "90%",
    height: 500,
    padding: 0,
    alignItems: "center",
  },  

  //일정 등록 버튼
  register: {
    right: 10,
    width: 40,
    height: 40,
    backgroundColor: "rgba(255,255,255,1)",
    borderWidth: 1,
    borderColor: "rgba(90,90,90,0)",
    borderRadius: 10,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  //일정 추가 토글 버튼
  registerschedule: {
    width: 52,
    height: 52,
    backgroundColor: "rgba(200,200,200,0.5)",
    borderRadius: 10,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    bottom: 10,
  },
  //삭제 버튼
  delete: {
    justifyContent: "center",
    alignItems: "center",
    width: 36,
    height: 28,
    backgroundColor: "rgba(230,0,0,1)",
    borderRadius: 10,
  },
  //일정 등록 칸 입력부분 스타일
  textinput: {
    left: 10,
    width: "60%",
    height: 40,
    backgroundColor: "rgba(250,250,250,0.8)",
    borderWidth: 1,
    borderColor: "rgb(40,40,40)",
    padding: 10,
  },

  //모달 창 안에 표시될 일정 텍스트 스타일
  modalcontentText: {
    fontSize: 16,
    padding: 2,
    borderRadius: 5,
    marginTop: 1,
    overflow: "hidden",
  },
  //modal창 안에 일정 텍스트 프레임
  modalcontentelement: {
    // backgroundColor: 'red',
    width: "100%",

    justifyContent: "space-between",
    flexDirection: "row",
  },
  //picker 스타일
  picker: {
    width: 140,
    height: 55,
    borderWidth: 2,
    borderColor: "black",
    borderRadius: 10,
  },
  customUnderline: {
    marginHorizontal: 0,
    height: 1, // 밑줄 두께
    width: "100%", // 밑줄 길이
    backgroundColor: "rgba(0,0,0,0.2)", // 밑줄 색상
    marginTop: 0, // 밑줄과 텍스트 사이의 거리
  },

  dateMover: {
    width: 345,
    height: 100,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "space-around",
    flexDirection: "row",
    borderRadius: 20,
  },
  pickmonth: {
    right: "12%",
    minWidth: 80,
    width: "30%",
    height: 100,
  },
  pickyYear: {
    minwidth: 100,
    width: "35%",
    height: 100,
  },
  movebutton: {
    right: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 54,
    height: 28,
    borderRadius: 10,
    backgroundColor: "rgba(180,200,220, 1)",
  },
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
});
