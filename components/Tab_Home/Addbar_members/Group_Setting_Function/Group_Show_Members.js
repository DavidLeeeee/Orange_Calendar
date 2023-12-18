import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import GroupmemberList from "../../../Tab_Friends/W_GroupmemberList";
import { firebase } from "../../../../../Afirebaseconfig";

export default function Groupmember(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [memberdata, setMemberdata] = useState([]);

  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  //그룹원들 데이터 불러오기 함수
  const getGroupMember = async () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("그룹원")
      .orderBy("created_at", "desc")
      .onSnapshot(
        async (querySnapshot) => {
          const updatedDataPromises = querySnapshot.docs.map((doc) => {
            return db.collection("users").doc(doc.data().email).get();
          });

          // 모든 유저 정보를 가져오는 Promise를 실행
          const userInfos = await Promise.all(updatedDataPromises);

          // 이제 모든 유저 정보가 준비되었으므로, updatedData에 추가
          const updatedData = userInfos
            .map((userInfoDoc, index) => {
              if (!userInfoDoc.exists) {
                console.log("No user data found!");
                return null;
              }
              const userInfo = userInfoDoc.data();
              const userDoc = querySnapshot.docs[index];
              return {
                name: userInfo.UserName,
                email: userInfo.email,
                power: userDoc.data().power,
                imgurl: userInfo.imgurl,
              };
            })
            .filter(Boolean); // null 값을 필터링

          setMemberdata(updatedData);
        },
        (error) => {
          console.error("Error loading members:", error);
        }
      );
  };

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            {/* 최상단 바 */}
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
                width: "100%",
              }}
            >
              <TouchableOpacity
                style={{ alignItems: "flex-end" }}
                onPress={() => setModalVisible(!modalVisible)}
              >
                <Icon name="arrow-back" size={25}></Icon>
              </TouchableOpacity>

              <Text style={styles.modalText}>그룹원 관리</Text>
              <View style={{ width: 25 }}></View>
            </View>

            <ScrollView style={{ width: "100%" }}>
              {/* 그룹원 데이터, 선택된 그룹, showmember 컴포넌트를 넘겨준다.
                    showmember 컴포넌트를 넘겨주는 이유는 GroupmemberList를 호출하는 Group_Waiting과 차별화하기 위해. */}
              <GroupmemberList
                data={memberdata}
                selectedGroup={props.selectedGroup}
                component="showmember"
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        //qualification에 권한의 true, false 값이 담긴다. false일 때 접근 불가능하게.
        onPress={() => {
          setModalVisible(true);
          getGroupMember();
        }}
        style={styles.memostyle1}
      >
        <Text style={styles.inputtext}>그룹원 관리</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    padding: 12,
    backgroundColor: "skyblue",
    flexDirection: "row",
    justifyContent: "space-between",

    borderRadius: 20,
  },
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
    width: 330,
    height: "70%",
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
  buttonOpen: {
    backgroundColor: "#F194FF",
  },
  buttonClose: {
    backgroundColor: "white",
    height: 60,
  },
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
  memostyle1: {
    width: 280,
    height: 40,
    backgroundColor: "rgba(200,200,200,0.15)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.3)",
    padding: 10,
    alignItems: "center", // 텍스트를 수직/수평 중앙 정렬
  },
  memostyle2: {
    width: 320,
    height: 200,
    backgroundColor: "lightgray",
    borderRadius: 10,

    padding: 10,
  },
  memostyle3: {
    width: 320,
    height: 255,
    backgroundColor: "lightgray",
    borderRadius: 10,

    padding: 10,
  },
  inputtext: {
    color: "black",
    paddingLeft: 5,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0.5,
  },
  register: {
    width: 100,
    height: 45,
    backgroundColor: "skyblue",
    borderRadius: 10,
    padding: 10,
  },
  registertext: {
    color: "black",
    textAlign: "center",
  },
});
