import React, { useState, useCallback, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  Button,
  Modal,
  Alert,
  TouchableOpacity,
} from "react-native";
import { TextInput } from "react-native-gesture-handler";
import * as ImagePicker from "expo-image-picker";
import { firebase } from "../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/FontAwesome";
import { useSelector, useDispatch } from "react-redux";
import { selectSignatureStyles } from "../Redux/selector";

export default function Profile_Edit() {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  //현재 유저 찾기
  const [ThisUser, setThisUser] = useState({
    // 초기값을 설정하거나, 불러온 데이터로 초기화
    UserName: "",
    introduce: "",
    // ... 기타 필요한 필드들
  });

  useEffect(() => {
    firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.email)
      .get()
      .then((snapshot) => {
        if (snapshot.exists) {
          setThisUser(snapshot.data());
        } else {
          console.log("does not exist");
        }
      });
  }, []);

  //데이터베이스 정의
  const db = firebase.firestore();
  //이미지 업로드하기
  const upload = async (uri, folderName) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = firebase.auth().currentUser.email;
    const Fileref = firebase.storage().ref().child(`${folderName}/${filename}`);
    await Fileref.put(blob);
    const url = await Fileref.getDownloadURL();

    // firebase user에 imgurl 업데이트
    let userDocRef = db
      .collection("users")
      .doc(firebase.auth().currentUser.email);
    userDocRef.update({
      imgurl: url,
    });

    // identifycode 가져오기
    let userDoc = await userDocRef.get();
    let identifycode = userDoc.data().identifycode;

    // identify 컬렉션에도 imgurl 업데이트
    db.collection("identify")
      .doc(identifycode[0])
      .collection(identifycode)
      .doc(firebase.auth().currentUser.email)
      .update({
        imgurl: url,
      });
  };

  const uri = ThisUser.imgurl;
  const [image, setImage] = useState(uri);

  //이미지 선택
  const pickImage = async () => {
    try {
      // No permissions request is necessary for launching the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, //이미지 수정여부
        aspect: [1, 1],
        quality: 0.1,
      });

      if (!result.canceled) {
        const url = await upload(result?.assets[0]?.uri, "profile"); //업로드 img, folder_name
        setImage(url); //자신의 이미지를 설정한다.
        console.log("Image uploaded to Firebase Storage:", url);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };
  //변경 모달창
  //1. 이름 변경
  const [modalVisible, setModalVisible] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const updateUserName = async () => {
    try {
      const userRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email);
      await userRef.update({
        UserName: newUserName,
      });
      setThisUser((prevState) => ({
        ...prevState,
        UserName: newUserName,
      }));
      setModalVisible(false);
      // Optionally, update any local state or do any other necessary actions after updating the Firestore document
    } catch (error) {
      console.error("Error updating user name: ", error);
    }
  };

  //2. 소갯말 변경
  const [introduceModalVisible, setIntroduceModalVisible] = useState(false);
  const [newIntroduce, setNewIntroduce] = useState("");

  const updateIntroduce = async () => {
    try {
      const userRef = firebase
        .firestore()
        .collection("users")
        .doc(firebase.auth().currentUser.email);
      await userRef.update({
        introduce: newIntroduce,
      });
      // Firebase 업데이트 후 로컬 상태 업데이트
      setThisUser((prevState) => ({
        ...prevState,
        introduce: newIntroduce,
      }));

      setIntroduceModalVisible(false);
      // 여기에서 추가적인 로직 (예: 로컬 상태 업데이트 등)을 수행할 수 있습니다.
    } catch (error) {
      console.error("Error updating introduce: ", error);
    }
  };

  const [mytext, setmytext] = useState("소갯말을 입력하세요.");
  const [mynum, setmynum] = useState("+82 010-4106-2416");

  return (
    <View
      style={[styles.container, signatureStyles ? signatureStyles.field : {}]}
    >
      <View style={{ padding: 20 }}></View>
      <>
        <TouchableOpacity onPress={pickImage}>
          <Image
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              borderColor: "black",
              borderWidth: 1,
            }}
            source={{
              uri: uri,
            }}
          />
          <View style={styles.overlay}>
            <Icon name="gear" size={15} color="rgba(70, 70, 70, 0.9)" />
          </View>
        </TouchableOpacity>
      </>
      <View style={{ padding: 6 }}></View>

      {/* 시용자의 이름 */}

      <TouchableOpacity
        style={{ width: "90%" }}
        onPress={() => setModalVisible(true)}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderBottomWidth: 1, // 밑줄의 두께 설정
            borderBottomColor: "rgba(150,150,150,0.5)", // 밑줄의 색상 설정
            marginTop: 20,
          }}
        >
          <Text
            style={[
              styles.textname,
              signatureStyles ? signatureStyles.Textcolor : {},
            ]}
          >
            {ThisUser.UserName}
          </Text>
          <Icon
            name="angle-right"
            size={24}
            color="grey"
            style={[
              signatureStyles ? signatureStyles.Textcolor : {},
              { marginLeft: "90%" },
            ]}
          />
        </View>
      </TouchableOpacity>

      <View style={{ padding: 6 }}></View>

      {/* 소갯말 */}
      <TouchableOpacity
        style={{ width: "90%" }}
        onPress={() => setIntroduceModalVisible(true)}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderBottomWidth: 1, // 밑줄의 두께 설정
            borderBottomColor: "rgba(150,150,150,0.5)", // 밑줄의 색상 설정
          }}
        >
          <Text
            style={[
              styles.textintroduce,
              signatureStyles ? signatureStyles.Textcolor : {},
            ]}
          >
            {ThisUser.introduce}
          </Text>
          <Icon
            name="angle-right"
            size={24}
            color="grey"
            style={[
              signatureStyles ? signatureStyles.Textcolor : {},
              { marginLeft: "90%" },
            ]}
          />
        </View>
      </TouchableOpacity>

      <View style={{ padding: 10 }}></View>

      <View style={{ padding: 10 }}></View>

      {/* 이름 변경 모달 */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(50,50,50,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "70%",
              //backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              marginBottom: 170,
            }}
          >
            <TextInput
              style={{
                borderWidth: 0,
                borderBottomWidth: 0.5,
                borderColor: "white",
                marginTop: 10,
                padding: 5,
                fontSize: 20,
                textAlign: "center",
                color: "white",
              }}
              value={newUserName}
              onChangeText={setNewUserName}
              placeholder={ThisUser.UserName}
              placeholderTextColor="grey"
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginVertical: 10,
              }}
            >
              <TouchableOpacity
                onPress={updateUserName}
                style={{
                  backgroundColor: "#000000", // 강조 색상
                  padding: 10,
                  borderRadius: 5,
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>변경하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setNewUserName(""); // 이 부분을 추가하여 newUserName 상태 값을 빈 문자열로 설정
                }}
                style={{
                  backgroundColor: "#FFFFFF", // 눈에 띄지 않는 색상
                  padding: 10,
                  borderRadius: 5,
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "black", fontSize: 16 }}>취소하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 소갯말 변경 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={introduceModalVisible}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(50,50,50,0.9)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: "70%",
              //backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              marginBottom: 170,
            }}
          >
            <TextInput
              style={{
                borderWidth: 0,
                borderBottomWidth: 0.5,
                borderColor: "white",
                marginTop: 10,
                padding: 5,
                fontSize: 20,
                textAlign: "center",
                color: "white",
              }}
              value={newIntroduce}
              onChangeText={setNewIntroduce}
              placeholder={ThisUser.introduce}
              placeholderTextColor="grey"
            />
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginVertical: 10,
              }}
            >
              <TouchableOpacity
                onPress={updateIntroduce}
                style={{
                  backgroundColor: "#000000", // 강조 색상
                  padding: 10,
                  borderRadius: 5,
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "white", fontSize: 16 }}>변경하기</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIntroduceModalVisible(false);
                  setNewIntroduce("");
                }}
                style={{
                  backgroundColor: "#FFFFFF", // 눈에 띄지 않는 색상
                  padding: 10,
                  borderRadius: 5,
                  width: 100,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "black", fontSize: 16 }}>취소하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    alignItems: "center",
  },
  //프로필 사진 변경
  overlay: {
    position: "absolute", // 절대 위치
    bottom: 0, // 우측 하단 위치 조정
    right: 0,
    width: 25, // 오버레이 크기 설정
    height: 25,
    borderRadius: 12.5, // 원형 오버레이
    backgroundColor: "rgba(200, 200, 200, 0.6)", // 검정색 반투명 오버레이
    justifyContent: "center", // 내부 아이콘을 중앙에 배치 (필요한 경우)
    alignItems: "center", // 내부 아이콘을 중앙에 배치 (필요한 경우)
  },
  //이름 스타일
  textname: {
    position: "absolute",
    fontSize: 18,
    textAlign: "center",
    flex: 1,
  },
  //소개말 스타일
  textintroduce: {
    position: "absolute",
    fontSize: 15,
    textAlign: "center",
  },
});
