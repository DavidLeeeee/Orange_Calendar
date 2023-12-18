import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import Icon from "react-native-vector-icons/MaterialIcons";
import DeleteModal from "./Delete_Modal";
import { firebase } from "../../../../Afirebaseconfig";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3;

export default function DailyWeatherComponent({
  widgets,
  setWidgets,
  selectedGroup,
}) {
  //위치 정보 가져오기
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState(null);
  //날씨 정보 담는 변수
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const userEmail = firebase.auth().currentUser.email;

  useEffect(() => {
    async function fetchLocationAndWeather() {
      console.log("날씨로드중");
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("위치 권한이 거부되었습니다.");
        setLoading(false);
        return;
      }

      let locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData.coords);

      // 위치 정보를 기반으로 날씨 데이터 가져오기
      const API_KEY = -axios
        .get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${locationData.coords.latitude}&lon=${locationData.coords.longitude}&appid=${API_KEY}&units=metric`
        )
        .then((response) => {
          setWeatherData(response.data);
          setCity(response.data.name); // Set city name
          setLoading(false);
        })
        .catch((error) => {
          setErrorMsg("날씨 정보를 불러오는 데 실패했습니다.");
          setLoading(false);
        });
    }

    fetchLocationAndWeather();
  }, []);

  function WeatherIcon() {
    if (!weatherData) return null; // or return a default/loading icon

    const id = weatherData.weather[0].id;
    if (id === 800) return <Icon name="wb-sunny" size={24} color="#FFD700" />;
    if (id >= 200 && id <= 232)
      return <Icon name="flash-on" size={24} color="#800080" />;
    if (id >= 300 && id <= 321)
      return <Icon name="grain" size={24} color="#ADD8E6" />;
    if (id >= 500 && id <= 531)
      return <Icon name="umbrella" size={24} color="#1E90FF" />;
    if (id >= 600 && id <= 622)
      return <Icon name="ac-unit" size={24} color="#87CEEB" />;
    if (id >= 701 && id <= 781)
      return <Icon name="fog" size={24} color="#A9A9A9" />;
    if (id >= 801 && id <= 804)
      return <Icon name="cloud" size={24} color="#DEDEDE" />;

    return <Icon name="error" size={24} color="black" />;
  }

  if (errorMsg) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>{errorMsg}</Text>
      </View>
    );
  }

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
        return docId.endsWith("오늘의날씨");
      });

      // 일치하는 문서들을 삭제
      for (let doc of matchingDocs) {
        await doc.ref.delete();
      }

      // 로컬 상태인 widgets에서 일치하는 항목을 제거하고, state를 업데이트
      const updatedWidgets = widgets.filter((widget) =>
        widget.id ? !widget.id.endsWith("오늘의날씨") : true
      );

      setWidgets(updatedWidgets);
      hideDeleteModal();

      await onDelete_list_update(); // 순서를 업데이트합니다.
    } catch (error) {
      console.error("Error deleting the widget:", error);
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.8} onLongPress={showDeleteModal}>
      <LinearGradient
        colors={["#1E90FF", "#1E90FF", "#87CEFA"]} // 원하는 그라데이션 색상을 설정합니다.
        style={styles.widgetBox}
        //style={{ flex: 1, borderRadius: 10 }} // 필요한 경우 스타일을 추가합니다.
      >
        <View
          style={{
            alignItems: "center",
            justifyContent: "flex-end",
            flexDirection: "row",
          }}
        >
          <Text
            style={{
              fontWeight: "600",
              fontSize: 30,
              color: "white",
              textShadowColor: "rgba(0, 0, 0, 0.4)",
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {city || "..."}
          </Text>
          <Icon
            name="near-me"
            size={12}
            color="white"
            style={{
              paddingLeft: 5,
              textShadowColor: "rgba(0, 0, 0, 0.4)",
              textShadowOffset: { width: -1, height: 1 },
              textShadowRadius: 4,
            }}
          />
        </View>
        <View
          style={{
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: 5,
          }}
        >
          <WeatherIcon />
          <Text
            style={{
              fontWeight: "400",
              fontSize: Platform.OS === "android" ? 15 : 20,
              color: "white",
              textShadowColor: "rgba(0, 0, 0, 0.2)",
              textShadowOffset: { width: -0.5, height: 1 },
              textShadowRadius: 4,
            }}
          >
            {weatherData
              ? `${weatherData.main.temp.toFixed(0)} ℃`
              : "불러오는 중..."}
          </Text>
        </View>

        {weatherData && (
          <>
            <View
              style={{
                justifyContent: "space-around",
                alignItems: "center",
                flexDirection: "row",
                padding: 5,
              }}
            >
              <View style={styles.weatherBox}>
                <Icon
                  style={styles.IconShadow}
                  name="opacity"
                  size={24}
                  color="white"
                />

                <Text
                  style={[
                    styles.IconShadow,
                    {
                      fontWeight: "400",
                      fontSize: Platform.OS === "android" ? 8 : 10,
                    },
                  ]}
                >
                  {weatherData.main.humidity}%
                </Text>
              </View>
              <View style={styles.weatherBox}>
                <Icon
                  style={styles.IconShadow}
                  name="toys"
                  size={24}
                  color="white"
                />
                <Text
                  style={[
                    styles.IconShadow,
                    {
                      fontWeight: "400",
                      fontSize: Platform.OS === "android" ? 8 : 10,
                    },
                  ]}
                >
                  {parseFloat(weatherData.wind.speed).toFixed(0)} m/s
                </Text>
              </View>
            </View>
            <View
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                flexDirection: "row",
                marginBottom: 5,
              }}
            >
              <Icon
                style={styles.IconShadow}
                name="wb-sunny"
                size={24}
                color="gold"
              />

              <View style={{ alignItems: "center", flexDirection: "column" }}>
                <Text
                  style={[
                    styles.IconShadow,
                    {
                      fontSize: Platform.OS === "android" ? 8 : 10,
                      color: "white",
                    },
                  ]}
                >
                  {new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </Text>
                <Text
                  style={[
                    styles.IconShadow,
                    {
                      fontSize: Platform.OS === "android" ? 8 : 10,
                      color: "white",
                    },
                  ]}
                >
                  {new Date(weatherData.sys.sunset * 1000).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </Text>
              </View>

              <Icon
                style={styles.IconShadow}
                name="brightness-2"
                size={24}
                color="silver"
              />
            </View>
          </>
        )}

        <DeleteModal
          isVisible={isDeleteModalVisible}
          onDelete={handleDelete}
          onClose={hideDeleteModal}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ViewBox: {
    flexDirection: "row", // 가로 방향으로 아이템 배치
    flexWrap: "wrap", // 아이템이 화면 너비를 초과하면 다음 행으로 이동
    backgroundColor: "white",
  },
  widgetBox: {
    padding: 8,
    width: itemWidth,
    height: 200, // height는 width와 동일하게 설정1
    //backgroundColor: "rgba(173, 216, 230, 1)",
    margin: (width * 0.05 - 8) / 2, // 각 요소 사이의 간격 조정
    borderRadius: 10, // 디자인 향상을 위한 라운드 처리
  },
  IconShadow: {
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 4,
  },
  weatherBox: {
    alignItems: "center",
    flexDirection: "column",
    padding: 5,
  },
});
