import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import Power1 from "./Group_Authority_Select";
import Power2 from "./Group_Authority_Member";
import { firebase } from "../../../../../Afirebaseconfig";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

const Tab = createMaterialTopTabNavigator();

export default function Grouppower(props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalVisible2, setModalVisible2] = useState(false);
  const [selectedAuthority, setSelectedAuthority] = useState(null);
  const [authorityList, setAuthorityList] = useState([]);
  const [qualification, setQualification] = useState("");

  const [selectedMemberTab, setSelectedMemberTab] = useState("");
  const [selectedAuthorityTab, setSelectedAuthorityTab] = useState("");
  const [authorityname, setAuthorityname] = useState("");
  const [isCustom, setIsCustom] = useState("");

  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  useEffect(() => {
    getqualification();
  });

  useEffect(
    () => {
      getAuthority();
    },
    [props.selectedGroup],
    [authorityList]
  );

  //Show_Member의 getqualification와는 다른게 true, false 상관 없이
  //권한이 manager면 접근 가능하게 함.
  const getqualification = async () => {
    const docRef = await db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("그룹원")
      .doc(currentUser.email)
      .get();

    const qualificationdata = docRef.data().power;
    setQualification(qualificationdata);
  };

  //권한 버튼들 ex) 리더, 공동 리더 버튼 등.
  const handlePress = async (authority) => {
    const docRef = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .doc(authority) 
        .get();

    const isCustom = docRef.data().Custom;
    
    setIsCustom(isCustom);
    setSelectedAuthority(authority);

    setModalVisible2(true);
  };

  const getAuthority = async () => {
    try {
      const docRef = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("권한")
        .orderBy("created_at") // created_at 필드를 기준으로 오름차순 정렬
        .get();

      const newAuthorityList = [];

      docRef.forEach((doc) => {
        // 문서의 ID(이름)를 배열에 추가합니다.
        const authorityName = doc.id;
        newAuthorityList.push(authorityName);
      });

      setAuthorityList(newAuthorityList);
      console.log("GroupAuthority: ", authorityList);
    } catch (error) {
      console.error("Error getting authority: ", error);
    }
  };

  const CreatedAt = new Date().getTime();

  //권한 추가 함수. Firebase 연동 해야됨.
  const addNewAuthority = async () => {
    const docRef = await db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(authorityname)
      .set({
        Memo: true,
        Schedule: true,
        Repeat: true,
        Alarm: false,
        Admin: false,
        Todo: false,
        Widget: false,
        created_at: CreatedAt,
        Custom: true,
      });

    // 현재 권한 목록에 추가할 새로운 권한 생성
    const newAuthority = authorityname;

    // 새로운 권한을 목록에 추가
    setAuthorityList([...authorityList, newAuthority]);
  };

  const [additionalButtonsVisible, setAdditionalButtonsVisible] =
    useState(false);

  const toggleAdditionalButtons = () => {
    setAdditionalButtonsVisible(!additionalButtonsVisible);
  };

  const deleteCustomAuth = async (authority) => {
    await db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(authority)
      .delete();
  }

  return (
    <View>
      {/* 리더, 공동리더, 멤버 버튼이 있는 모달 창. */}
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
                onPress={() => {
                  setModalVisible(!modalVisible);
                  setAdditionalButtonsVisible(!additionalButtonsVisible);
                  setAuthorityname(""); // TextInput 초기화
                }}
              >
                <Icon name="west" size={25}></Icon>
              </TouchableOpacity>
              <Text style={styles.modalText}>권한 설정</Text>
              <View style={{ width: 30 }}></View>
            </View>

            {/* 권한 설정, 멤버 설정 버튼이 있는 모달 창. */}
            <View style={{ marginTop: 15, width: "100%", height: "90%" }}>
              <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible2}
                onRequestClose={() => {
                  setModalVisible2(false);
                  setSelectedMemberTab("");
                  setSelectedAuthorityTab("");
                }}
              >
                <View style={styles.centeredView}>
                  <View style={styles.modalView}>
                  <ScrollView>
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
                        onPress={() => {
                          setModalVisible2(false);
                          setSelectedMemberTab("");
                          setSelectedAuthorityTab("");
                        }}
                        style={{ alignItems: "flex-end" }}
                      >
                        <Icon name="arrow-back" size={25}></Icon>
                      </TouchableOpacity>
                      <Text style={styles.modalText}>{selectedAuthority}</Text>
                      
                      {isCustom && (
                        <TouchableOpacity 
                          style={{ marginRight: 5 }}
                          onPress={() => {
                            deleteCustomAuth(selectedAuthority);
                            getAuthority();
                            setModalVisible2(false);
                          }}
                        >
                          <Text>삭제</Text>
                        </TouchableOpacity>
                      )}
                      {!isCustom && (
                        <View style={{ marginRight: 30 }}></View>
                      )}
                    </View>

                    <View style={{ padding: 5 }}></View>

                    <View
                      style={{
                        flexDirection: "row",
                        width: "100%",
                        height: "88%",
                        justifyContent: "center",
                      }}
                    >
                      <View style={{ width: "100%" }}>
                        <View>
                          {selectedAuthority && (
                            <View>
                              <View style={{}}>
                                <TouchableOpacity
                                  onPress={() =>
                                    setSelectedAuthorityTab(
                                      selectedAuthorityTab === "권한 설정"
                                        ? null
                                        : "권한 설정"
                                    )
                                  }
                                  style={[
                                    selectedAuthorityTab === "권한 설정"
                                      ? styles.pressedButton
                                      : styles.authoritybutton,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      selectedAuthorityTab === "권한 설정"
                                        ? styles.tabPressedButtonText
                                        : styles.tabButtonText,
                                    ]}
                                  >
                                    권한 설정
                                  </Text>
                                </TouchableOpacity>

                                <View style={{ marginBottom: 10 }}>
                                  {selectedAuthorityTab === "권한 설정" && (
                                    <Power1
                                      selectedGroup={props.selectedGroup}
                                      power={selectedAuthority}
                                    />
                                  )}
                                </View>

                                <TouchableOpacity
                                  onPress={() =>
                                    setSelectedMemberTab(
                                      selectedMemberTab === "멤버 설정"
                                        ? null
                                        : "멤버 설정"
                                    )
                                  }
                                  style={[
                                    selectedMemberTab === "멤버 설정"
                                      ? styles.pressedButton
                                      : styles.authoritybutton,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      selectedMemberTab === "멤버 설정"
                                        ? styles.tabPressedButtonText
                                        : styles.tabButtonText,
                                    ]}
                                  >
                                    멤버 설정
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <View style={{}}>
                                {selectedMemberTab === "멤버 설정" && (
                                  <Power2
                                    selectedGroup={props.selectedGroup}
                                    power={selectedAuthority}
                                  />
                                )}
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              <View
                style={{
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ width: "40%" }}>
                  {authorityList.map((authority) => (
                    <TouchableOpacity
                      key={authority}
                      onPress={() => handlePress(authority)}
                      style={styles.authoritybutton}
                    >
                      <Text>{authority}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View
                  style={{
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      toggleAdditionalButtons();
                    }}
                    style={{
                      backgroundColor: additionalButtonsVisible
                        ? "black"
                        : "white",
                      width: 150,
                      borderRadius: 8,
                      alignItems: "center",
                      padding: 5,
                      borderColor: "black",
                      borderWidth: additionalButtonsVisible ? 1.5 : 1.5,
                    }}
                  >
                    <Text
                      style={{
                        color: additionalButtonsVisible ? "white" : "black",
                      }}
                    >
                      권한 추가
                    </Text>
                  </TouchableOpacity>

                  {additionalButtonsVisible && (
                    <View
                      style={{
                        position: "absolute",
                        bottom: "10%",
                        marginBottom: 30,
                        alignItems: "center",
                        flexDirection: "row",
                      }}
                    >
                      <TextInput
                        style={styles.textinput}
                        placeholder="내용"
                        onChangeText={(content) => setAuthorityname(content)}
                        autoCorrect={false}
                      />

                      <TouchableOpacity
                        style={{
                          ...styles.register,
                          backgroundColor: authorityname ? "black" : "white",
                          borderColor: "black",
                          borderWidth: authorityname ? 0 : 1,
                        }}
                        onPress={() => {
                          addNewAuthority();
                          setAdditionalButtonsVisible(false);
                        }}
                      >
                        <Text
                          style={{
                            color: authorityname ? "white" : "black",
                            textAlign: "center",
                          }}
                        >
                          등록
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 가장 바깥의 권한 설정 탭 */}
      <TouchableOpacity
        onPress={() => {
          setModalVisible(true);
        }}
        style={styles.memostyle1}
      >
        <Text style={styles.inputtext}>권한 설정</Text>
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
    marginLeft: 8,
    justifyContent: "center",
    width: 50,
    height: 34,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 6,
    padding: 0,
  },
  registertext: {
    color: "black",
    textAlign: "center",
  },
  authoritybutton: {
    alignItems: "center",
    backgroundColor: "white",
    width: "100%",
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "grey",
    marginBottom: 10,
  },
  pressedButton: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    width: "100%",
    padding: 5,
    borderRadius: 5,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(0, 0, 0, 1)",
  },
  tabPressedButtonText: { color: "rgba(255,255,255,1)" },
  tabButtonText: { color: "rgba(0,0,0,1)" },
  textinput: {
    borderWidth: 1,
    borderColor: "black",
    width: 150,
    height: 34,
    backgroundColor: "white",
    borderRadius: 6,
  },
});