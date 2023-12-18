import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  View,
  Image,
  Animated,
  LayoutAnimation,
  UIManager,
  Alert,
  Easing,
  Platform,
  Modal,
  ScrollView,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";

import { updateSignatureColor } from "../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../Redux/selector";

const Dashboard = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [ASKModalVisible, setASKModalVisible] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const db = firebase.firestore();
  const writeInquiries = (title, content) => {
    const CreatedAt = new Date().getTime();

    const db = firebase.firestore();

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

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  const navigation = useNavigation();
  const [ThisUser, setThisUser] = useState({
    // 초기값을 설정하거나, 불러온 데이터로 초기화
    UserName: "",
    introduce: "",
    // ... 기타 필요한 필드들
  });

  //현재 유저 찾기
  useEffect(() => {
    const unsubscribe = firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.email)
      .onSnapshot((snapshot) => {
        if (snapshot.exists) {
          setThisUser(snapshot.data());
        } else {
          console.log("does not exist");
        }
      });

    // Clean up the subscription on unmount
    return () => unsubscribe(); // unsubscribe 함수를 반환합니다.
  }, []);

  //폰트(캘린더에 보여줄) 설정하기
  // 로컬 상태 설정
  const [fontSize, setFontSize] = useState(10);
  const [fontWeight, setFontWeight] = useState(400);
  const [scheduleHeight, setScheduleHeight] = useState(11);

  const fetchFontData = async () => {
    const db = firebase.firestore();
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      const doc = await db.collection("users").doc(currentUser.email).get();
      if (doc.exists) {
        setFontSize(doc.data().fontsize);
        setFontWeight(doc.data().fontWeight);
        setScheduleHeight(doc.data().scheduleheight);
        console.log(
          "폰트불러오기",
          doc.data().fontsize,
          doc.data().fontWeight,
          doc.data().scheduleheight
        );
      }
    }
  };

  const saveToFirestore = async () => {
    const db = firebase.firestore();
    const currentUser = firebase.auth().currentUser;

    if (currentUser) {
      try {
        await db.collection("users").doc(currentUser.email).update({
          fontsize: fontSize,
          fontWeight: fontWeight,
          scheduleheight: scheduleHeight,
        });
        console.log("정보가 저장되었습니다.");
        fetchFontData(); // 정보가 저장된 후 데이터를 다시 가져옵니다.
      } catch (error) {
        console.error("Firestore에 저장 중 오류 발생: ", error);
      }
    }
  };

  useEffect(() => {
    fetchFontData();
  }, []);

  const incrementFontSize = () => {
    setFontSize((prevSize) => prevSize + 1);
    setScheduleHeight((prevHeight) => prevHeight + 1);
  };

  const decrementFontSize = () => {
    setFontSize((prevSize) => Math.max(8, prevSize - 1)); // 최소값 설정을 위해 Math.max 사용
    setScheduleHeight((prevHeight) => Math.max(8, prevHeight - 1)); // 최소값 설정을 위해 Math.max 사용
  };

  const incrementFontWeight = () => {
    setFontWeight((prevWeight) => Math.min(900, prevWeight + 100)); // 최대값 설정을 위해 Math.min 사용
  };

  const decrementFontWeight = () => {
    setFontWeight((prevWeight) => Math.max(100, prevWeight - 100)); // 최소값 설정을 위해 Math.max 사용
  };

  //프로필 하단의 레이아웃 애니메이션
  // Android에서 LayoutAnimation을 사용하기 위한 설정
  if (
    Platform.OS === "android" &&
    UIManager.setLayoutAnimationEnabledExperimental
  ) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }

  const [calendarHeight, setCalendarHeight] = useState(0);
  const [supportHeight, setSupportHeight] = useState(0);
  const [loginedHeight, setLoginedHeight] = useState(0);
  const calendarOpacity = useRef(new Animated.Value(0)).current;
  const supportOpacity = useRef(new Animated.Value(0)).current;
  const loginedOpacity = useRef(new Animated.Value(0)).current;

  const toggleCalendar = () => {
    const newHeight = calendarHeight === 0 ? 150 : 0;
    console.log("Before Animation:", calendarOpacity.__getValue()); // 애니메이션 시작 전 값 출력

    setCalendarHeight(newHeight);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    console.log(newHeight);

    Animated.spring(calendarOpacity, {
      toValue: newHeight === 0 ? 0 : 1,
      useNativeDriver: true,
      speed: 1, // 애니메이션의 속도를 조정할 수 있습니다.
      bounciness: 10, // 탄력 효과를 조정할 수 있습니다.
    }).start(() => {
      console.log("After Animation:", calendarOpacity.__getValue()); // 애니메이션 시작 전 값 출력
    });
  };

  const toggleSupport = () => {
    const newHeight = supportHeight === 0 ? 60 : 0;
    setSupportHeight(newHeight);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    Animated.spring(supportOpacity, {
      toValue: newHeight === 0 ? 0 : 1,
      useNativeDriver: true,
      speed: 1, // 애니메이션의 속도를 조정할 수 있습니다.
      bounciness: 10, // 탄력 효과를 조정할 수 있습니다.
    }).start(() => {
      console.log("Support Animation Finished!", supportOpacity.__getValue());
    });
  };

  const toggleLogined = () => {
    const newHeight = loginedHeight === 0 ? 90 : 0;
    setLoginedHeight(newHeight);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    Animated.spring(loginedOpacity, {
      toValue: newHeight === 0 ? 0 : 1,
      useNativeDriver: true,
      speed: 1, // 애니메이션의 속도를 조정할 수 있습니다.
      bounciness: 10, // 탄력 효과를 조정할 수 있습니다.
    }).start(() => {
      console.log("Support Animation Finished!", loginedOpacity.__getValue()); // 로그로 현재 애니메이션 값 출력
    });
  };

  const signatureColor = useSelector((state) => state.signatureColor);
  const dispatch = useDispatch(); // Redux의 useDispatch 훅 사용

  const handleColorChange = (newColor) => {
    dispatch(updateSignatureColor(newColor)); // Redux 상태 업데이트

    // 여기에 Firebase 업데이트 로직을 추가합니다.
    const userRef = firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.email);
    userRef
      .update({
        signatureColor: newColor,
      })
      .then(() => {
        console.log("Firebase updated with new color:", newColor);
      })
      .catch((error) => {
        console.error("Error updating color on Firebase:", error);
      });
  };

  //비밀번호 변경
  const changePassword = () => {
    firebase
      .auth()
      .sendPasswordResetEmail(firebase.auth().currentUser.email)
      .then(() => {
        alert("비밀번호 변경 이메일을 전송했습니다!");
      })
      .catch((error) => {
        alert(error);
      });
  };

  // 컴포넌트 내부에서 스타일을 정의
  const EditFontstyle = {
    overflow: "hidden",
    backgroundColor: "rgba(100, 100, 100, 0.2)",
    width: "100%",
    alignItems: "center",
    height: scheduleHeight,
    justifyContent: "center",
    marginVertical: 2,
    fontSize: fontSize,
    fontWeight: `${fontWeight}`, // fontWeight는 문자열로 변환해야 합니다.
  };

  const getInquiries = async () => {
    const db = firebase.firestore();

    try {
      // 사용자의 '문의' 컬렉션에 대한 참조를 가져옵니다.
      const inquiriesRef = db
        .collection("users")
        .doc(firebase.auth().currentUser.email)
        .collection("문의")
        .orderBy("created_at", "asc");

      // onSnapshot을 사용하여 '문의' 컬렉션의 변화를 실시간으로 감시합니다.
      const unsubscribe = inquiriesRef.onSnapshot(
        (snapshot) => {
          const newInquiries = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 가져온 데이터로 상태를 업데이트합니다.
          setInquiries(newInquiries);
        },
        (err) => {
          console.error("Failed to subscribe to inquiries collection: ", err);
        }
      );

      console.log(inquiries);

      // 컴포넌트가 언마운트될 때 리스너를 해제합니다.
      return () => unsubscribe();
    } catch (error) {
      console.error("Error getting inquiries: ", error);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  return (
    <View
      style={[
        styles.container,
        signatureStyles ? signatureStyles.background : {},
      ]}
    >
      {/* 최상단 바 */}
      <View
        style={[
          styles.container3,
          signatureStyles ? signatureStyles.background : {},
          Platform.OS === "android" ? { paddingTop: 32 } : {},
        ]}
      >
        <Text
          style={[
            {
              flex: 1,
              textAlign: "center",
              fontWeight: "400",
              fontSize: 18,
            },
            signatureStyles ? signatureStyles.Textcolor : {},
          ]}
        >
          프로필
        </Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <View style={{ padding: 10 }}></View>
        <Image
          source={{
            uri: ThisUser.imgurl,
          }}
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            borderColor: "black",
            borderWidth: 1,
          }}
        />
        <View style={{ padding: 6 }}></View>
        {/* 시용자의 이름 */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View style={{ paddingHorizontal: 5 }}>
            <Text
              style={[
                styles.text1,
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              {ThisUser.UserName}
            </Text>
          </View>
          <Text style={styles.identifyCodeStyle}>#{ThisUser.identifycode}</Text>
        </View>

        <View style={{ padding: 6 }}></View>
        {/* 소갯말 */}
        <Text
          style={[
            styles.text2,
            signatureStyles ? signatureStyles.Textcolor : {},
          ]}
        >
          {ThisUser.introduce}
        </Text>
        <View style={{ padding: 10 }}></View>
        {/* 프로필 편집과 로그아웃 */}
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("프로필 편집")}
            style={[
              {
                backgroundColor: "white",
                borderRadius: 6,
                width: "90%",
                height: 30,
                padding: 5,
                borderColor: "rgba(0,0,0,0.2)",
                borderWidth: 1,
              },
              signatureStyles ? signatureStyles.content : {},
            ]}
          >
            <Text
              style={[
                { textAlign: "center", fontSize: 14 },
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              프로필 편집
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ padding: 10 }}></View>
      </View>

      <View
        style={{ backgroundColor: "rgba(120,120,120,0.4)", height: 0.5 }}
      ></View>

      <View
        style={{ paddingLeft: 10, alignItems: "center", flexDirection: "row" }}
      >
        {/* 이 부분에, 캘린더 설정 > 라는 bar를 만들어줘. 해당 바를 누르면 높이 40%를 채우는 칸이 나오도록. */}
        {/* 이 부분에, 고객 센터 > 라는 bar를 만들어줘. 해당 바를 누르면 높이 20%를 채우는 칸이 나오게 */}
        {/* 이 때, 각 칸은 애니메이션으로 부드럽게 슬라이드되면서 bar로부터 내려와. */}
        {/* bar에서 내려오는 애니메이션 창은 아래에 있는 요소들을 밀어내. */}
      </View>
      <View
        style={[
          styles.container2,
          signatureStyles ? signatureStyles.background : {},
        ]}
      >
        <View
          style={[styles.barContainer, { backgroundColor: "rgba(0,0,0,0)" }]}
        >
          <TouchableOpacity
            style={[
              styles.downbarContainer,
              {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              },
              signatureStyles ? signatureStyles.content : {},
            ]}
            onPress={() => {
              toggleCalendar();
            }}
          >
            <Text
              style={[
                styles.downbartext,
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              캘린더 설정
            </Text>
            <Icon
              name={
                calendarHeight === 0
                  ? "keyboard-arrow-down"
                  : "keyboard-arrow-up"
              }
              size={24}
              color="gray"
              style={[signatureStyles ? signatureStyles.Textcolor : {}]}
            />
          </TouchableOpacity>
          <Animated.View
            style={{
              height: calendarHeight,
              backgroundColor: "rgba(240,240,240,0.95)",
              width: "100%",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-around",
              opacity: calendarOpacity, // 추가
            }}
            pointerEvents={calendarHeight === 0 ? "none" : "auto"} // 추가
          >
            <View
              style={{
                marginLeft: 0,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                width: "45%",
                height: "100%",
                //backgroundColor: "yellow",
              }}
            >
              <View
                style={{
                  marginLeft: 10,
                  flexDirection: "column",
                  width: "40%",
                }}
              >
                <View
                  style={{
                    width: "80%",
                    height: 90,
                    borderWidth: 0.5,
                    borderColor: "rgba(220,220,220,1)",
                    padding: 2,
                  }}
                >
                  <Text style={EditFontstyle}>일정 1</Text>
                  <Text style={EditFontstyle}>일정 2</Text>
                </View>
                <TouchableOpacity
                  style={{
                    width: "80%",
                    height: 24,
                    backgroundColor: "rgba(100,140,250,1)",
                    padding: 2,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={saveToFirestore}
                >
                  <Text>저장</Text>
                </TouchableOpacity>
              </View>
              <View>
                <View style={styles.adjusterSet}>
                  <Text>크기</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.minusButton}
                      onPress={decrementFontSize}
                    >
                      <Text>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.plusButton}
                      onPress={incrementFontSize}
                    >
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.spaceBetweenSets} />
                <View style={styles.adjusterSet}>
                  <Text>두께</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.minusButton}
                      onPress={decrementFontWeight}
                    >
                      <Text>-</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.plusButton}
                      onPress={incrementFontWeight}
                    >
                      <Text>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.separator} />
            <View
              style={{
                marginLeft: 0,
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                width: "45%",
                height: "100%",
                //backgroundColor: "yellow",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "500" }}>Theme</Text>
              <View style={{ marginTop: 10 }}>
                {[
                  ["white", "black", "midnightblue"],
                  ["peachpuff", "orange", "aliceblue"],
                  ["sienna", "cornsilk", "darkgreen"], // 추가할 색상 2개를 YOUR_COLOR_8과 YOUR_COLOR_9로 치환하세요.
                ].map((colorRow, rowIndex) => (
                  <View
                    key={rowIndex}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                      marginBottom: rowIndex < 2 ? 10 : 0, // 마지막 줄은 marginBottom을 적용하지 않습니다.
                    }}
                  >
                    {colorRow.map((color) => (
                      <TouchableOpacity
                        key={color}
                        style={{
                          width: 30,
                          height: 30,
                          backgroundColor: color,
                          borderWidth: 3,
                          borderColor:
                            signatureColor === color
                              ? "rgba(20,20,20,0.4)"
                              : color === "white"
                              ? "rgba(240,240,240,0.6)"
                              : "transparent", // 흰색의 경우 'lightgray' 경계선 추가
                        }}
                        onPress={() => handleColorChange(color)}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>

        <View
          style={[styles.barContainer, { backgroundColor: "rgba(0,0,0,0)" }]}
        >
          <TouchableOpacity
            style={[
              styles.downbarContainer,
              {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              },
              signatureStyles ? signatureStyles.content : {},
            ]}
            onPress={toggleSupport}
          >
            <Text
              style={[
                styles.downbartext,
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              고객 센터
            </Text>
            <Icon
              name={
                supportHeight === 0
                  ? "keyboard-arrow-down"
                  : "keyboard-arrow-up"
              }
              size={24}
              color="gray"
              style={[signatureStyles ? signatureStyles.Textcolor : {}]}
            />
          </TouchableOpacity>
          <Animated.View
            style={{
              height: supportHeight,
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              opacity: supportOpacity,
            }}
            pointerEvents={supportHeight === 0 ? "none" : "auto"} // 추가
          >
            <TouchableOpacity style={styles.loginedbarStyle}>
              <Text>FAQ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginedbarStyle}
              onPress={() => {
                setModalVisible(true);
                getInquiries();
              }}
            >
              <Text>1:1 문의</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.3)",
              justifyContent: "center",
              alignItems: "center",
            }}
            activeOpacity={1}
            onPressOut={() => Keyboard.dismiss()}
          >
            <View
              style={{
                width: 350,
                height: 600,
                backgroundColor: "white",
                borderRadius: 10,
                padding: 10,
                alignItems: "center",
              }}
            >
              {!ASKModalVisible ? (
                <>
                  <View
                    style={{
                      width: "100%",
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
                        setModalVisible(false);
                        setTitle("");
                        setContent("");
                      }}
                    >
                      <Icon name="arrow-back" size={25} color="black" />
                    </TouchableOpacity>

                    <Text style={styles.modalText}>1:1 문의</Text>
                    <View style={{ width: 28 }}></View>
                  </View>
                  {/* 문의 목록 보기 */}
                  <ScrollView
                    style={{
                      backgroundColor: "rgba(255,255,255 ,1)",
                      width: "100%",
                      maxHeight: "90%",
                    }}
                  >
                    {inquiries.map((inquiry, index) => (
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
                          style={{
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onPress={() => deleteInquiries(inquiry.title)}
                        >
                          <Text>삭제</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  <TouchableOpacity
                    style={{
                      marginTop: 25,
                      width: "100%",
                      height: 30,
                      backgroundColor: "white",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 0.5,
                      borderColor: "black",
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setASKModalVisible(true);
                    }}
                  >
                    <Text>문의하기</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View
                    style={{
                      width: "100%",
                      paddingBottom: 10,
                      marginBottom: 20,
                      flexDirection: "row",
                      alignItems: "center",
                      borderColor: "#e0e0e0",
                      borderBottomWidth: 0.5,
                      // iOS 그림자 스타일
                      shadowColor: "#000",
                    }}
                  >
                    <Text style={styles.modalText}>문의 작성</Text>
                  </View>
                  {/* 새 문의 작성하기 */}
                  <TextInput
                    style={styles.titleinput}
                    placeholder="제목"
                    placeholderTextColor={"lightgrey"}
                    onChangeText={(title) => setTitle(title)}
                    autoCorrect={false}
                    value={title}
                  />
                  <TextInput
                    style={styles.contentinput}
                    placeholder="내용"
                    placeholderTextColor={"lightgrey"}
                    onChangeText={(content) => setContent(content)}
                    autoCorrect={false}
                    value={content}
                    multiline={true} // 여러 줄 입력 활성화
                    numberOfLines={15}
                  />
                  <TouchableOpacity
                    style={{
                      marginTop: 25,
                      width: "90%",
                      height: 30,
                      backgroundColor: "rgba(0,156,255, 1)",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 0.5,
                      borderColor: "rgba(0,156,255, 1)",
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      writeInquiries(title, content);
                      setTitle("");
                      setContent("");
                    }}
                  >
                    <Text style={{ fontSize: 16, color: "white" }}>등록</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      marginTop: 5,
                      width: "90%",
                      height: 30,
                      backgroundColor: "white",
                      justifyContent: "center",
                      alignItems: "center",
                      borderWidth: 0.5,
                      borderColor: "black",
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      setASKModalVisible(false);
                      setTitle("");
                      setContent("");
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>취소</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
        {/* <InquiryPage
          modalVisible={modalVisible}
          inquiries={inquiries}
          onClose={closeModal}
        /> */}

        <View
          style={[styles.barContainer, { backgroundColor: "rgba(0,0,0,0)" }]}
        >
          <TouchableOpacity
            style={[
              styles.downbarContainer,
              {
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              },
              signatureStyles ? signatureStyles.content : {},
            ]}
            onPress={toggleLogined}
          >
            <Text
              style={[
                styles.downbartext,
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              로그인 관리
            </Text>
            <Icon
              name={
                loginedHeight === 0
                  ? "keyboard-arrow-down"
                  : "keyboard-arrow-up"
              }
              size={24}
              color="gray"
              style={[signatureStyles ? signatureStyles.Textcolor : {}]}
            />
          </TouchableOpacity>
          <Animated.View
            style={{
              height: loginedHeight,
              backgroundColor: "rgba(250,250,250,0.1)",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
              opacity: loginedOpacity, // 추가
            }}
            pointerEvents={loginedHeight === 0 ? "none" : "auto"} // 추가
          >
            {/* 로그인된 이메일 정보를 표시하는 바 */}
            <View style={styles.loginedbarStyle}>
              <Text>Logined Email : {ThisUser.email}</Text>
              {/* userEmail은 상태 또는 prop으로부터 받아와야 합니다. */}
            </View>

            {/* 비밀번호 변경 기능을 수행하는 바 */}
            <TouchableOpacity
              style={styles.loginedbarStyle}
              onPress={() => {
                changePassword();
              }}
            >
              <Text>비밀번호 변경</Text>
            </TouchableOpacity>

            {/* 로그아웃을 수행하는 바 */}
            <TouchableOpacity
              style={styles.loginedbarStyle}
              onPress={() => {
                Alert.alert(
                  "로그아웃",
                  "정말 로그아웃 하시겠습니까?",
                  [
                    {
                      text: "취소",
                      style: "cancel",
                    },
                    {
                      text: "확인",
                      onPress: async () => {
                        const db = firebase.firestore();

                        try {
                          const userEmail = firebase.auth().currentUser.email;
                          if (userEmail) {
                            await db
                              .collection("users")
                              .doc(userEmail)
                              .collection("Token")
                              .doc("Token")
                              .delete();

                            console.log("Deleted token for: ", userEmail);

                            firebase.auth().signOut();
                          } else {
                            console.log("No user is currently signed in.");
                          }
                        } catch (error) {
                          console.error("Error deleting token: ", error);
                        }
                      },
                    },
                  ],
                  { cancelable: false }
                );
              }}
            >
              <Text>로그아웃</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container2: {
    flex: 1,
    padding: 10,
    backgroundColor: "red", //여기에 적용하기
  },
  barContainer: {
    width: "100%",
    backgroundColor: "rgba(250,250,250,0.1)",
    paddingBottom: 0,
  },
  downbarContainer: {
    marginVertical: 5,
    width: "100%",
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,1)",
    paddingBottom: 0,
    borderBottomColor: "rgba(0,0,0,0.3)",
    borderBottomWidth: 1,
  },
  downbartext: {
    color: "rgba(10,10,10,1)",
  },
  separator: {
    height: "100%",
    width: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  container: {
    flex: 1,
    backgroundColor: "red", //여기에 적용하기
  },
  container3: {
    paddingTop: 54,
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderColor: "rgba(120,120,120,0.2)",
    backgroundColor: "red", //여기에 적용하기
  },
  text1: {
    fontSize: 18,
  },
  identifyCodeStyle: {
    position: "absolute",
    right: "-10%",
    color: "dimgray", // 짙은 회색
    fontSize: 14,
  },
  text2: {
    fontSize: 14,
  },
  text3: {
    fontSize: 15,
    color: "grey",
  },
  scheduleBox: {
    width: "14.285714285714286%",
    height: 90,
    borderWidth: 0.5,
    borderColor: "rgba(220,220,220,1)",
    padding: 2,
  },
  EditFontstyle2: {
    overflow: "hidden",
    backgroundColor: "rgba(100, 100, 100, 0.1)",
    width: "100%",
    //height: scheduleHeight,
    height: 11,
    justifyContent: "center",
    marginVertical: 2,
    fontSize: 10,
    fontWeight: "400",
    //fontSize: fontSize,
    //fontWeight: fontWeight,
  },
  adjusterSet: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  spaceBetweenSets: {
    height: 10,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 5,
    marginHorizontal: 5,
  },
  minusButton: {
    width: 40,
    height: 30,
    backgroundColor: "white",
    borderWidth: 1,
    borderRightWidth: 0.2,
    borderColor: "black",
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  plusButton: {
    width: 40,
    height: 30,
    backgroundColor: "white",
    borderWidth: 1,
    borderLeftWidth: 0.2,
    borderColor: "black",
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: "center",
  },
  loginedbarStyle: {
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 5,
    backgroundColor: "rgba(240,240,240,0.95)",
    height: 28,
    width: "100%",
    marginBottom: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  titleinput: {
    width: "90%",
    height: 40,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.3)",
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
  contentinput: {
    marginTop: 10,
    width: "90%",
    height: 360,
    backgroundColor: "rgba(250, 250, 250, 1)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.3)",
    padding: 7,
    borderRadius: 5,
    marginBottom: 5,
  },
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
});

export default Dashboard;
