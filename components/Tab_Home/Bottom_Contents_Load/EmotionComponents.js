import React, { useState, useEffect } from "react";
import { Image } from "expo-image";
import { firebase } from "../../../../Afirebaseconfig";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import DeleteModal from "./Delete_Modal";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3; //위젯의 크기 지정을 위한 변수

export default function EmotionComponents({
  widgets,
  setWidgets,
  selectedGroup,
}) {
  const [emotions, setEmotions] = useState([]);
  const [mostCommonEmotion, setMostCommonEmotion] = useState("");
  const userEmail = firebase.auth().currentUser.email;

  const emotionToImage = {
    angry: require("../../../assets/emotions/angry.png"),
    fun: require("../../../assets/emotions/fun.png"),
    soso: require("../../../assets/emotions/soso.png"),
    shame: require("../../../assets/emotions/shame.png"),
    sad: require("../../../assets/emotions/sad.png"),
    rock: require("../../../assets/emotions/rock.png"),
  };
  const emotionColors = {
    angry: ["#FFA5A5", "#FF6B6B", "#FF5A5A"], // 빨강
    fun: ["#FFDD44", "#FFF099", "#FFF4A5"], // 노랑
    soso: ["#88FF7F", "#96FFA3", "#A5FFC7"], // 초록
    shame: ["#FF88B6", "#FF92D3", "#FFA5E0"], // 분홍
    sad: ["#5A8AFF", "#699AFF", "#85E5FF"], // 파랑
    rock: ["#8C8C8C", "#A6A6A6", "#D3D3D3"], // 회색
  };
  const emotionColors2 = {
    angry: [
      "rgba(255, 90, 90, 0.9)",
      "rgba(255, 107, 107, 0.9)",
      "rgba(255, 90, 90, 0.9)",
    ],
    fun: [
      "rgba(255, 221, 68, 0.9)",
      "rgba(255, 240, 153, 0.9)",
      "rgba(255, 244, 165, 0.9)",
    ],
    soso: [
      "rgba(136, 255, 127, 0.9)",
      "rgba(150, 255, 163, 0.9)",
      "rgba(165, 255, 199, 0.9)",
    ],
    shame: [
      "rgba(255, 136, 182, 0.9)",
      "rgba(255, 146, 211, 0.9)",
      "rgba(255, 165, 224, 0.9)",
    ],
    sad: [
      "rgba(90, 138, 255, 0.9)",
      "rgba(105, 154, 255, 0.9)",
      "rgba(133, 229, 255, 0.9)",
    ],
    rock: [
      "rgba(140, 140, 140, 0.9)",
      "rgba(166, 166, 166, 0.9)",
      "rgba(211, 211, 211, 0.9)",
    ],
  };
  const emotionComments = {
    angry:
      "분노는 때로 필요하지만, 잠시 멈추고 상황을 명확히 볼 수 있는 여유를 가져보세요.",
    fun: "즐거움을 느낄 때는 그 순간을 최대한 즐기세요.",
    soso: "모든 날이 빛나는 날일 순 없어요. 때로는 그런 날들이 우리에게 안정감을 줍니다.",
    shame:
      "이런 감정은 당신의 섬세함과 진정성을 보여주는 것이에요. 진정한 아름다움이 발견됩니다.",
    sad: "픔을 통해 우리는 더 강해질 수 있어요. 기억하세요, 이 또한 지나갈 거예요.",
    rock: "때때로 마음이 공허해질 때가 있어요.휴식을 취하며 에너지를 재충전하세요.",
  };

  const subscribeToEmotions = () => {
    console.log(`***이달의 감정 위젯 렌더링***`);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");

    const startOfMonthId = `${year}${month}01`;
    const endOfMonthId = `${year}${month}${new Date(year, month, 0).getDate()}`;

    const emotionsRef = firebase
      .firestore()
      .collection("users")
      .doc(userEmail)
      .collection("emotions")
      .where(firebase.firestore.FieldPath.documentId(), ">=", startOfMonthId)
      .where(firebase.firestore.FieldPath.documentId(), "<=", endOfMonthId);

    // 실시간 동기화를 위한 onSnapshot 사용
    return emotionsRef.onSnapshot(
      (snapshot) => {
        const fetchedEmotions = snapshot.docs.map((doc) => doc.data().feel);
        console.log("Fetched Emotions:", fetchedEmotions);
        setEmotions(fetchedEmotions);

        // 각각의 요소들의 개수를 세기
        const emotionCount = fetchedEmotions.reduce((acc, curr) => {
          acc[curr] = (acc[curr] || 0) + 1;
          return acc;
        }, {});

        // 가장 많은 요소를 찾기
        const commonEmotion = Object.entries(emotionCount).sort(
          (a, b) => b[1] - a[1]
        )[0][0];
        setMostCommonEmotion(commonEmotion); // 상태 업데이트
        console.log(commonEmotion);
      },
      (error) => {
        console.error("실시간 감정 데이터 가져오기 실패:", error);
      }
    );
  };

  useEffect(() => {
    const unsubscribe = subscribeToEmotions();

    return () => unsubscribe();
  }, []);

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
        return docId.endsWith("이달의감정");
      });

      // 일치하는 문서들을 삭제
      for (let doc of matchingDocs) {
        await doc.ref.delete();
      }

      // 로컬 상태인 widgets에서 일치하는 항목을 제거하고, state를 업데이트
      const updatedWidgets = widgets.filter((widget) =>
        widget.id ? !widget.id.endsWith("이달의감정") : true
      );

      setWidgets(updatedWidgets);
      hideDeleteModal();

      await onDelete_list_update(); // 순서를 업데이트합니다.
    } catch (error) {
      console.error("Error deleting the widget:", error);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.widgetBox}
      onLongPress={showDeleteModal}
    >
      <LinearGradient
        colors={
          emotionColors[mostCommonEmotion] || ["#D3D3D3", "#A6A6A6", "#8C8C8C"]
        }
        style={{ flex: 1, borderRadius: 10 }}
      >
        <Text style={styles.dateText}>이달의 감정</Text>
        <View style={styles.emotionContainer}>
          {emotions.map((emotion, index) => (
            <Image
              key={index}
              source={emotionToImage[emotion]}
              style={styles.emotionImage}
            />
          ))}
        </View>
        <Text style={styles.commentText}>
          {emotionComments[mostCommonEmotion]}
        </Text>
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
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
  },
  widgetBox: {
    overflow: "hidden",
    padding: 0,
    width: itemWidth,
    height: 200,
    margin: (width * 0.05 - 8) / 2,
    borderRadius: 10,
  },
  dateText: {
    padding: 0,
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    width: "100%",
    height: 30,
    lineHeight: 20,
    textAlign: "center",
    shadowColor: "#000", // 그림자 색상 설정
    shadowOffset: { width: 0, height: 2 }, // 그림자 위치 설정
    shadowOpacity: 0.5, // 그림자 투명도 설정
    shadowRadius: 3, // 그림자 반경 설정
  },
  emotionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 4, // 양쪽 끝에 4픽셀의 패딩 추가
  },
  emotionImage: {
    width: (itemWidth - 6 * 6 - 8) / 5, // - 8는 양쪽의 패딩을 고려
    height: (itemWidth - 6 * 6 - 8) / 5,
    margin: 3,
  },
  commentText: {
    position: "absolute",
    bottom: 5,

    color: "white",
    fontSize: 8,
    fontWeight: "400",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 5,
    shadowRadius: 4,
  },
});
