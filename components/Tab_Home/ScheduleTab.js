import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Modal, Alert, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";
import { FlatList, ScrollView } from "react-native-gesture-handler";

export default ScheduleTab = (props) => {
  const db = firebase.firestore();
  const currentUser = firebase.auth().currentUser;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMemberVisible, setModalMemberVisible] = useState(false);

  const [joinMember, setJoinMember] = useState([]);
  const [rejectMember, setRejectMember] = useState([]);
  const [noneMember, setNoneMember] = useState([]);

  async function sendPushNotification(expoPushToken, userName) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "테스트 알림",
      body: userName + "님이 일정을 등록하셨습니다.",
      data: { someData: "여기 데이터를 넣으시오" },
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  }

  const sendAlarm = async (selecteddate, content) => {
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();

    const userRef = db.collection("users").doc(currentUser.email);

    const currentUserName = (await userRef.get()).data().UserName;
    const currentUserToken = (
      await userRef.collection("Token").doc("Token").get()
    ).data().token;

    const GroupRef = db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .get();
    const userimgUrl = (await GroupRef).data().userimg;

    const GroupmemberRef = db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("그룹원");

    GroupmemberRef.get()
      .then(async (querySnapshot) => {
        const pushemails = [];
        const pushTokens = [];

        querySnapshot.forEach((doc) => {
          if (doc.exists) {
            const memberemail = doc.data().email;
            if (memberemail && memberemail !== currentUser.email) {
              pushemails.push(memberemail);
            }
          } else {
            console.log("해당 사용자의 문서가 존재하지 않습니다.");
          }
        });

        console.log(pushemails);

        // pushemails 배열을 사용하여 각 유저의 Token 문서에 접근
        for (const email of pushemails) {
          const tokenDoc = await db
            .collection("users")
            .doc(email)
            .collection("Token")
            .doc("Token")
            .get();
          if (tokenDoc.exists) {
            const token = tokenDoc.data().token;
            if (token) {
              pushTokens.push(token);
            }
          }
        }

        console.log(pushTokens);

        if (pushemails.length > 0) {
          pushTokens.forEach((expoPushToken) => {
            sendPushNotification(expoPushToken, currentUserName);
          });
          // pushemails 배열에서 각각의 푸시 알림 토큰을 사용하여 알림을 보냄.
          pushemails.forEach(async (email) => {
            const ScheduleRef = db
              .collection("users")
              .doc(email)
              .collection("알림")
              .doc(currentUserName + "님의 일정 알림_" + content);

            await ScheduleRef.set({
              name: props.selectedGroup,
              writer: currentUserName,
              date: selecteddate,
              schedule: content,
              profileImageUrl: userimgUrl,
              timestamp: timestamp,
              match: "일정 알림",
            });
          });
        } else {
          console.log("그룹원들 중에서 유효한 푸시 알림 토큰이 없습니다.");
        }
      })
      .catch((error) => {
        console.error("문서를 가져오는 중 오류 발생:", error);
      });
  };

  const fetchScheduleMember = async () => {
    try {
      // 전체 그룹원 목록을 가져옵니다.
      const groupMembersSnapshot = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .get();
  
      let allGroupMembers = [];
      groupMembersSnapshot.forEach(doc => {
        allGroupMembers.push(doc.id);
      });
  
      // 각 그룹원의 참가 여부를 확인합니다.
      const scheduleMembersSnapshot = await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("일정")
        .doc(props.datedata + "_" + props.content)
        .collection(props.datedata + "_" + props.content)
        .get();
  
      let joinMembers = [];
      let rejectMembers = [];
      let noneMembers = [];
  
      allGroupMembers.forEach(memberId => {
        const doc = scheduleMembersSnapshot.docs.find(d => d.id === memberId);

        const userNameRef = db.collection("users").doc(memberId).get();
        
        userNameRef.then(userData => {
          const userName = userData.data().UserName;
          const userimg = userData.data().imgurl;

          console.log(userName)
  
          if (doc && doc.exists) {
            const memberData = doc.data();
            const memberid = doc.id;
            if (memberData.isJoin === true) {
              joinMembers.push({ memberid, userName, userimg });
              setJoinMember(joinMembers);
            } else if (memberData.isJoin === false) {
              rejectMembers.push({ memberid, userName, userimg });
              setRejectMember(rejectMembers);
            }
          } else {
            const memberid = memberId;
            noneMembers.push({ memberid, userName, userimg });
            setNoneMember(noneMembers);
          }
        });
      });
    } catch (error) {
      console.error("Error fetching schedule members:", error);
    }
  };

  const joinSchedule = async () => {
    Alert.alert("일정에 참가되셨습니다.")

    const userNameRef = db.collection("users")
    .doc(currentUser.email)
    .get()

    const userName = (await userNameRef).data().UserName;

    db.collection("Group calendar")
    .doc(props.selectedGroup)
    .collection("일정")
    .doc(props.datedata + "_" + props.content)
    .collection(props.datedata + "_" + props.content)
    .doc(currentUser.email)
    .set({
      name: userName,
      isJoin: true
    })
  }

  const rejectSchedule = () => {
    Alert.alert("일정에 불참되셨습니다.")

    db.collection("Group calendar")
    .doc(props.selectedGroup)
    .collection("일정")
    .doc(props.datedata + "_" + props.content)
    .collection(props.datedata + "_" + props.content)
    .doc(currentUser.email)
    .set({
      isJoin: false
    })
  }

  const fetchisMemberBusy = async () => {
    try {
      // 그룹원 컬렉션에서 문서들을 가져옵니다.
      const groupMembersSnapshot = await db.collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .get();
  
      // 각 그룹원 문서에 대해 반복합니다.
      for (const doc of groupMembersSnapshot.docs) {
        const memberId = doc.id;

        const userNameRef = db.collection("users")
        .doc(memberId)
        .get()

        const userName = (await userNameRef).data().UserName;
  
        const busyDoc = await db.collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("그룹원")
          .doc(memberId)
          .collection(props.datedata)
          .doc(props.datedata)
          .get();
  
        if (busyDoc.exists) {
          if(busyDoc.data().busy === true) {
            db.collection("Group calendar")
              .doc(props.selectedGroup)
              .collection("일정")
              .doc(props.datedata + "_" + props.content)
              .collection(props.datedata + "_" + props.content)
              .doc(memberId)
              .set({
                name: userName,
                isJoin: !busyDoc.data().busy
              })
          }
        }
      }
    } catch (error) {
      console.error("Error fetching isBusy values:", error);
    }
  }

  useEffect(() => {
    fetchisMemberBusy();
  }, []);

  const resetMember = () => {
    setJoinMember([]);
    setRejectMember([]);
    setNoneMember([]);
  }

  let alarmbutton = null;
  let joinbutton = null;

  if (props.selectedGroup !== "My Calendar" && props.alarmauthority === true) {
    alarmbutton = (
      <View>
        <TouchableOpacity
          style={styles.delete}
          onPress={() => {
            sendAlarm(props.datedata, props.content);
          }}
        >
          <Icon name="notifications" size={18} color="rgba(35,30,0,0.5)" />
        </TouchableOpacity>
      </View>
    );
  }

  if (props.selectedGroup !== "My Calendar") {
    joinbutton = (
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity
          style={styles.join}
          onPress={() => {
            joinSchedule();
          }}
        >
          <Icon name="login" size={18} color="rgba(35,30,0,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reject}
          onPress={() => {
            rejectSchedule();
          }}
        >
          <Icon name="logout" size={18} color="rgba(35,30,0,0.5)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={{...styles.reject, backgroundColor: "white", borderWidth: 1, borderColor: "grey" }}
          onPress={() => {
            fetchScheduleMember();
            setModalMemberVisible(!modalMemberVisible);
          }}
        >
          <Icon name="person-outline" size={18} color="rgba(35,30,0,0.5)" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View 
        style={{
          ...styles.modalcontentelement,
          flexDirection: 'row',
        }}
      >
        <View
          style={{
            flexDirection: props.selectedGroup === "My Calendar" ? 'row' : 'column',
          }}
        >
          <TouchableOpacity onPress={() => {setModalVisible(!modalVisible);}}>
            <Text style={{ ...styles.modalcontentText, width: 260 }} numberOfLines={1}>{props.content}</Text>
          </TouchableOpacity>

          <View style={{ height: 5 }}></View>

          {joinbutton}
        </View>
        {alarmbutton}
      </View>

      <View style={{ height: 5 }}></View>

      <Modal
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
              setModalVisible(!modalVisible);
          }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={{ padding: 10 }}
              onPress={() => {
                setModalVisible(!modalVisible);
              }}
            >
              <Icon
                name="close"
                size={25}
                color={"#000"}
              />
            </TouchableOpacity>

            {props.selectedGroup === "My Calendar" && props.isGroup ? (
              <Text>작성자: {props.writer}</Text>
            ) : props.selectedGroup !== "My Calendar" ? (
              <Text>작성자: {props.writer}</Text>
            ) : null}

            <Text style={{ ...styles.modalcontentText, marginHorizontal: 10 }}>{props.content}</Text>
          </View>
        </View>
      </Modal>

      <Modal
        transparent={true}
        visible={modalMemberVisible}
        onRequestClose={() => {
          setModalMemberVisible(!modalMemberVisible);
          resetMember();
        }}
      >
        <View style={styles.busycenteredView}>
          <View style={styles.busymodalView}>
            <View
              style={
                {
                  flexDirection: "row", // 수평 정렬
                  alignItems: "center", // 아이템들을 세로 중앙에 배치
                  backgroundColor: "lightgray", // 배경색 설정
                  borderRadius: 0,
                  padding: 10,
                  justifyContent: "space-between",
                }
              }
            >
                {/* 모달창 닫기 버튼 */}
                <TouchableOpacity
                    style={{
                      alignItems: "flex-end"
                    }}
                    onPress={() => {
                      setModalMemberVisible(!modalMemberVisible);
                      resetMember();
                    }}
                >
                    <Icon 
                      name="arrow-back" 
                      size={25} 
                      color="#000" 
                    />
                </TouchableOpacity>

                <Text style={styles.modalText}>그룹원 표시</Text>
                <View style={{ width: 28 }}></View>
            </View>

            <View style={{ width: "100%", padding: 5 }}>
              <Text style={styles.flatListText}>참가 멤버</Text>
              <FlatList
                data={joinMember}
                keyExtractor={(item) => item.memberid}
                renderItem={({ item }) => (
                  <View
                    style={styles.flatListView}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", width: "60%" }}>
                      <Image
                        source={{ uri: item.userimg }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 50,
                          marginRight: 10,
                        }}
                      />

                      <Text>{item.userName}</Text>
                    </View>
                  </View>
                )}
              />

              <Text style={styles.flatListText}>미참가 멤버</Text>
              <FlatList
                data={rejectMember}
                keyExtractor={(item) => item.memberid}
                renderItem={({ item }) => (
                  <View
                    style={styles.flatListView}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", width: "60%" }}>
                      <Image
                        source={{ uri: item.userimg }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 50,
                          marginRight: 10,
                        }}
                      />

                      <Text>{item.userName}</Text>
                    </View>
                  </View>
                )}
              />

              <Text style={styles.flatListText}>미투표 멤버</Text>
              <FlatList
                data={noneMember}
                keyExtractor={(item) => item.memberid}
                renderItem={({ item }) => (
                  <View
                    style={styles.flatListView}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", width: "60%" }}>
                      <Image
                        source={{ uri: item.userimg }}
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: 50,
                          marginRight: 10,
                        }}
                      />

                      <Text>{item.userName}</Text>
                    </View>
                  </View>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    height: 25,
    backgroundColor: "white",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    //borderRadius: 20,
    width: "80%",
    height: 200,
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
  },
  modalcontentText: {
    fontSize: 16,
    borderRadius: 5,
    marginTop: 1,
    overflow: "hidden",
  },
  //modal창 안에 일정 텍스트 프레임
  modalcontentelement: {
    // backgroundColor: 'red',
    marginLeft: 0,
    alignItems: 'center',
    width: "100%",
    justifyContent: "space-between",
  },
  delete: {
    width: 36,
    height: 28,
    backgroundColor: "rgba(255,240,80,1)", // 노란색으로 변경
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  join: {
    width: 36,
    height: 28,
    backgroundColor: "#3ADF00", // 노란색으로 변경
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  reject: {
    width: 36,
    height: 28,
    backgroundColor: "#848484", // 노란색으로 변경
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  busycenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
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
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
  flatListView: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  flatListText: {
    fontSize: 15, 
    borderBottomWidth: 0.5, 
    padding: 5
  }
});

//친구추가, 그룹참가, 그룹요청, 일정 네가지로 나뉘어서 표시하기 id로 추출해서 구분.
