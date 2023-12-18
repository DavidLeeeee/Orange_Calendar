import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Image,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";
import { CheckBox } from "react-native-elements";
import * as ImagePicker from "expo-image-picker";
import { ScrollView } from "react-native-gesture-handler";

//그룹 생성 함수, Home.js의 Modal에서 호출.
export default function GroupCreate({ isVisible, onClose }) {
  const [groupname, setGroupname] = useState("");
  const [grouptheme, setGrouptheme] = useState("");
  const [grouprange, setGrouprange] = useState("전체 공개");
  const [groupimg, setGroupimg] = useState("null");
  const [groupjoin, setGroupjoin] = useState("자동 참가");
  const [passwordis, setPasswordis] = useState(false);
  const [passwordvalue, setPasswordvalue] = useState("");

  //Separate state to hold the current value of groupname
  const [currentGroupname, setCurrentGroupname] = useState("");

  //그룹 코드 생성 함수
  const generateGroupCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const currentDate = new Date();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding leading zero if necessary
    const day = String(currentDate.getDate()).padStart(2, "0"); // Adding leading zero if necessary

    // Generate a random 4-character code
    let code = "";
    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }

    // Append the current month/day to the code
    code += `${month}${day}`;

    return code;
  };

  //그룹 생성 시 실행되는 함수
  const handleRegister = async () => {
    try {
      const db = firebase.firestore();
      const groupCalendarRef = db.collection("Group calendar");
      const currentUser = firebase.auth().currentUser;

      if (!currentUser) {
        console.error("No current user found.");
        return;
      }

      const generatedGroupCode = generateGroupCode();
      const groupManager = currentUser.email;

      // Fetch user data once
      const userRef = db.collection("users").doc(currentUser.email);
      const userData = await userRef.get();

      if (!userData.exists) {
        console.error("User document does not exist.");
        return;
      }

      const ManagerName = userData.data().UserName;
      const Managerimg = userData.data().imgurl;
      const leaderCreatedAt = new Date().getTime();
      const coLeaderCreatedAt = leaderCreatedAt + 1;
      const memberCreatedAt = coLeaderCreatedAt + 1;

      // Batch all set operations for efficiency
      const batch = db.batch();

      batch.set(groupCalendarRef.doc(groupname), {
        groupName: groupname,
        groupTheme: grouptheme,
        groupRange: grouprange,
        groupManager: groupManager,
        groupcode: generatedGroupCode,
        groupimg: groupimg,
        groupJoin: groupjoin,
        widgetOrder: 0,
        passwordEnabled: passwordis, // 비밀번호 활성화 상태 추가
        passwordValue: passwordis ? passwordvalue : null, // 비밀번호 값 추가 (비활성화시 null로 설정)
      });

      batch.set(
        groupCalendarRef
          .doc(groupname)
          .collection("그룹원")
          .doc(currentUser.email),
        {
          name: ManagerName,
          email: currentUser.email,
          power: "리더",
          imgurl: Managerimg,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
        }
      );

      const powers = [
        {
          docName: "리더",
          values: {
            Memo: true,
            Schedule: true,
            Repeat: true,
            Alarm: true,
            Admin: true,
            Todo: true,
            Widget: true,
            created_at: leaderCreatedAt,
            Custom: false,
          },
        },
        {
          docName: "공동 리더",
          values: {
            Memo: true,
            Schedule: true,
            Repeat: true,
            Alarm: true,
            Admin: false,
            Todo: true,
            Widget: true,
            created_at: coLeaderCreatedAt,
            Custom: false,
          },
        },
        {
          docName: "멤버",
          values: {
            Memo: true,
            Schedule: true,
            Repeat: true,
            Alarm: false,
            Admin: false,
            Todo: true,
            Widget: false,
            created_at: memberCreatedAt,
            Custom: false,
          },
        },
      ];

      powers.forEach((power) => {
        batch.set(
          groupCalendarRef.doc(groupname).collection("권한").doc(power.docName),
          power.values
        );
      });

      const userGroupRef = userRef.collection("Group");
      batch.set(userGroupRef.doc(groupname), {
        groupName: groupname,
        groupimg: groupimg,
        created_at: leaderCreatedAt,
        isTogether: false,
      });

      await batch.commit();

      setGroupname("");
      setGrouptheme("");
      setGrouprange("");
      setGroupjoin("");
      setGroupimg("null");
      setPasswordis(false);
      setPasswordvalue("");
    } catch (error) {
      console.error("Error creating group calendar:", error);
    }
  };

  //이미지 설정을 하기 위한 ImagePicker를 호출하는 함수.
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

  //설정한 이미지를 Fire storage에 등록하는 함수 + firestore에 등록하기 위한 url을 등록.
  const upload = async (uri, folderName) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = generateGroupCode();
    const Fileref = firebase.storage().ref().child(`${folderName}/${filename}`);
    await Fileref.put(blob);
    const url = await Fileref.getDownloadURL();

    return url; // 업로드된 이미지 URL 반환
  };

  const [charCount, setCharCount] = useState(0);

  const handleTextChange = (text) => {
    if (text.length <= 15) {
      setGroupname(text);
      setCurrentGroupname(text);
      setCharCount(text.length);
    }
  };

  const togglePasswordInput = () => {
    setPasswordis(!passwordis);
  };

  const handlePasswordChange = (text) => {
    setPasswordvalue(text);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {
        onClose();
      }}
    >
      <View style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}>
        {/* 최상단 바 */}
        <View
          style={{
            paddingTop: Platform.OS === "ios" ? 54 : 24,
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderBottomWidth: 1,
            borderColor: "#e0e0e0",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              onClose(); // 모달을 닫습니다.
              setGrouprange(null); // CheckBox의 상태를 초기화합니다.
              setGroupjoin(null); // CheckBox의 상태를 초기화합니다.
            }}
          >
            <Icon name="arrow-back" size={25}></Icon>
          </TouchableOpacity>
          <Text
            style={{
              flex: 1,
              textAlign: "center",
              fontWeight: "400",
              fontSize: 18,
            }}
          >
            그룹 생성
          </Text>
          <View style={{ width: 25 }}>
            {/* 빈 공간으로 아이콘과 텍스트 위치 조정 */}
          </View>
        </View>

        <ScrollView style={{ width: "100%" }}>
          {/* 사진 설정 */}
          <View style={{ alignItems: "center", marginTop: 40 }}>
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
                  uri: groupimg || "null",
                }}
              />
            </TouchableOpacity>
          </View>

          {/* 그룹 이름 설정 */}
          <View
            style={{
              paddingTop: 30,
              flexDirection: "row",
              marginTop: 20,
              paddingHorizontal: 20,
              alignItems: "center",
            }}
          >
            <TextInput
              style={styles.memostyle1}
              placeholder="그룹 이름을 입력해주세요."
              placeholderTextColor="grey" // 회색으로 설정
              value={groupname}
              onChangeText={handleTextChange}
              autoCorrect={false}
            />
            <Text>{charCount}/15</Text>
          </View>

          {/* 그룹 비밀번호 설정 */}
          <View style={styles.passwordContainer}>
            <TouchableOpacity
              style={
                passwordis
                  ? styles.toggleButtonActive
                  : styles.toggleButtonInactive
              }
              onPress={togglePasswordInput}
            >
              <Text>비밀번호 설정</Text>
            </TouchableOpacity>

            {passwordis ? (
              <TextInput
                style={styles.passwordInput}
                placeholder="비밀번호를 입력해주세요."
                placeholderTextColor={"rgba(0,0,0,0.2)"}
                value={passwordvalue}
                onChangeText={handlePasswordChange}
                //secureTextEntry
              />
            ) : (
              <View style={styles.inactivePasswordBox}>
                <Text style={{ color: "#B0B0B0" }}>비밀번호 비활성화</Text>
              </View>
            )}
          </View>

          {/* 그룹 공개 범위 설정 */}
          <View
            style={{
              marginTop: 40,
              borderTopWidth: 1,
              paddingVertical: 5,
              borderColor: "rgba(0,0,0,0.3)",
              width: "100%",
            }}
          >
            <Text
              style={{
                textAlign: "left",
                width: "100%",
                marginLeft: 20,
                fontSize: 15,
              }}
            >
              공개범위 설정
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 10,
            }}
          >
            <CheckBox
              title="전체공개"
              center="true"
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={grouprange === "전체 공개"}
              onPress={() => setGrouprange("전체 공개")}
              size={30} // 크기 조절
              containerStyle={{
                width: 130,
                backgroundColor: "transparent",
                borderWidth: 0, // 테두리 없앰
              }}
            />

            <CheckBox
              title="비공개"
              center="true"
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={grouprange === "비공개"}
              onPress={() => {
                setGrouprange("비공개");
              }}
              size={30} // 크기 조절
              containerStyle={{
                width: 130,
                backgroundColor: "transparent",
                borderWidth: 0, // 테두리 없앰
              }}
            />
          </View>
          <Text
            style={{
              textAlign: "center",
              color: "rgba(50,50,50,0.9)",
              fontSize: 14,
            }}
          >
            {grouprange === "전체 공개"
              ? "그룹코드, 그룹이름으로 사용자가 검색할 수 있습니다."
              : grouprange === "비공개"
              ? "그룹코드만으로 사용자가 검색할 수 있습니다."
              : null}
          </Text>

          {/* 그룹 자동참가, 참가대기 설정 */}
          <View
            style={{
              marginTop: 20,
              borderTopWidth: 1,
              paddingVertical: 5,
              borderColor: "rgba(200,200,200,0.4)",
              width: "100%",
            }}
          >
            <Text
              style={{
                textAlign: "left",
                width: "100%",
                marginLeft: 20,
                fontSize: 15,
              }}
            >
              그룹참가 설정
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginVertical: 10,
            }}
          >
            <CheckBox
              title="자동 참가"
              center="true"
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={groupjoin === "자동 참가"}
              onPress={() => setGroupjoin("자동 참가")}
              size={30} // 크기 조절
              containerStyle={{
                width: 130,
                backgroundColor: "transparent",
                borderWidth: 0, // 테두리 없앰
              }}
            />
            <CheckBox
              title="참가 대기"
              center="true"
              checkedIcon="dot-circle-o"
              uncheckedIcon="circle-o"
              checked={groupjoin === "참가 대기"}
              onPress={() => {
                setGroupjoin("참가 대기");
              }}
              size={30} // 크기 조절
              containerStyle={{
                width: 130,
                backgroundColor: "transparent",
                borderWidth: 0, // 테두리 없앰
              }}
            />
          </View>
          <Text
            style={{
              textAlign: "center",
              color: "rgba(50,50,50,0.9)",
              fontSize: 14,
            }}
          >
            {groupjoin === "자동 참가"
              ? "사용자가 자동으로 그룹에 참가됩니다."
              : groupjoin === "참가 대기"
              ? "관리자의 승인이 후에 참가됩니다."
              : null}
          </Text>
          <View
            style={{
              marginTop: 20,
              borderTopWidth: 1,
              paddingVertical: 5,
              borderColor: "rgba(0,0,0,0.3)",
              width: "100%",
            }}
          ></View>

          <TouchableOpacity
            onPress={() => {
              if (currentGroupname.trim() === "") {
                console.log("Group name is required");
              } else {
                handleRegister();
                onClose();
              }
            }}
            style={styles.register}
          >
            <Text style={styles.registertext}>등록</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  memostyle1: {
    width: "85%",
    height: 40,
    backgroundColor: "rgba(250,250,250,1)",
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
  },
  ButtonText: {
    width: 100,
    height: 40,
    backgroundColor: "lightgrey",
    borderRadius: 5,
    padding: 10,
    textAlign: "center",
  },
  space: {
    padding: 10,
  },
  register: {
    width: 100,
    height: 60,
    backgroundColor: "rgba(30,30,30,1)",
    borderRadius: 40,
    margin: 18,
    justifyContent: "center",
    alignSelf: "center",
  },
  registertext: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  ButtonText2: {
    width: 200,
    height: 40,
    backgroundColor: "lightgrey",
    borderRadius: 5,
    padding: 10,
    textAlign: "center",
  },
  //Joinscreen의 TextInput
  textInput: {
    paddingTop: 20,
    paddingBottom: 10,
    width: "100%",
    fontSize: 20,
    borderBottomColor: "#000",
    borderBottomWidth: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  //비밀번호
  passwordContainer: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  toggleButtonInactive: {
    borderColor: "#B0B0B0", // 짙은 회색
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "transparent",
  },
  toggleButtonActive: {
    borderColor: "black",
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgb(250,250,250)",
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    elevation: 8,
  },
  passwordInput: {
    height: 40,
    marginLeft: 10,
    flex: 1,
    padding: 10,
    borderColor: "grey",
    borderWidth: 1,
    borderRadius: 5,
  },
  inactivePasswordBox: {
    height: 40,
    marginLeft: 10,
    borderColor: "#B0B0B0",
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
