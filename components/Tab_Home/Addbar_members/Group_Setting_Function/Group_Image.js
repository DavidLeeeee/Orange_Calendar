import React, { useState, useEffect } from "react";
import { TouchableOpacity, Image, Alert, View, StyleSheet } from "react-native";
import * as ImagePicker from "expo-image-picker";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { firebase } from "../../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/FontAwesome";

export default function GroupImage(props) {
  const [groupcode, setGroupcode] = useState("");
  const [groupimg, setGroupimg] = useState("null"); // 이미지 URL을 저장할 상태값
  //비워두면 modal 열 때 빈 경로로 불러온다고 오류가 발생. 아무말인 null로 채워두니 해결.

  useEffect(() => {
    getGroupCode();
  }, []);

  const getGroupCode = async () => {
    try {
      const doc = await firebase
        .firestore()
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .get();
      if (doc.exists) {
        const data = doc.data();
        const groupcode = data.groupcode;
        setGroupcode(groupcode);
        setGroupimg(data.groupimg); // 이미지 URL 설정
      } else {
        console.log("Group calendar does not exist");
      }
    } catch (error) {
      console.error("Error getting group code:", error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.1,
      });

      if (!result.canceled) {
        const url = await upload(result.assets[0].uri, "Group_profile"); // 업로드 img, folder_name
        setGroupimg(url); // 새로운 이미지 URL 설정
        console.log("Image uploaded to Firebase Storage:", url);
      }
    } catch (error) {
      console.error("Error picking image:", error);
    }
  };

  const db = firebase.firestore();
  const upload = async (uri, folderName) => {
    const currentUser = firebase.auth().currentUser;

    const storage = firebase.storage();
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = groupcode;
    const Fileref = firebase.storage().ref().child(`${folderName}/${filename}`);
    await Fileref.put(blob);
    const url = await Fileref.getDownloadURL();
    props.selectedGroup;
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        db.collection("Group calendar")
          .doc(props.selectedGroup)
          .update({
            groupimg: url,
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });

        db.collection("users")
          .doc(currentUser.email)
          .collection("Group")
          .doc(props.selectedGroup)
          .update({
            groupimg: url,
          })
          .catch((error) => {
            console.error("Error writing document: ", error);
          });
      }
    });
    return url; // 업로드된 이미지 URL 반환
  };

  return (
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
          uri: groupimg || "null", // groupimg를 source로 사용
        }}
      />
      <View style={styles.overlay}>
        <Icon name="gear" size={15} color="rgba(70, 70, 70, 0.9)" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
});
