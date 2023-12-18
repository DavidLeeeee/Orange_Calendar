import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  Platform,
  Switch,
} from "react-native";
import { firebase } from "../../../Afirebaseconfig";
import { Image } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons";
import DraggableFlatList from "react-native-draggable-flatlist";
import { gestureHandlerRootHOC } from "react-native-gesture-handler";

export default function GroupEdit({ isVisible, onClose }) {
  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  const [docIds, setDocIds] = useState([]);
  
  const [buttonVisible, setButtonVisible] = useState(false);

  const toggleTogether = (groupname, isTogether) => {
    db.collection("users")
    .doc(currentUser.email)
    .collection("Group")
    .doc(groupname)
    .update({
      isTogether: !isTogether,
    })
  }

  const fetchGroupData = async () => {
    const groupRef = db
      .collection("users")
      .doc(currentUser.email)
      .collection("Group");

    groupRef.onSnapshot(async (groupSnapshot) => {
      let groups = [];

      for (let doc of groupSnapshot.docs) {
        const groupId = doc.id;
        const groupImage = doc.data().groupimg;
        const created_at = doc.data().created_at;
        const isTogether = doc.data().isTogether;

        // Fetch the power data for each group.
        const memberRef = await db
          .collection("Group calendar")
          .doc(groupId)
          .collection("그룹원")
          .doc(currentUser.email)
          .get();

        const memberPower = memberRef.data().power;

        groups.push({
          id: groupId,
          groupimg: groupImage,
          power: memberPower,
          created_at: created_at,
          isTogether: isTogether,
        });
      }

      groups.sort((a, b) => {
        if (a.created_at < b.created_at) return -1;
        if (a.created_at > b.created_at) return 1;
        return 0;
      });

      setDocIds(groups);
    });
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const QuitGroup = async (selectedGroup, power) => {
    const user = firebase.auth().currentUser;

    const userRef = firebase
      .firestore()
      .collection("users")
      .doc(user.email)
      .get();

    const currentUserName = (await userRef).data().UserName;

    const GroupRef = db.collection("Group calendar").doc(selectedGroup).get();

    const Groupmanageremail = (await GroupRef).data().groupManager;
    const groupimg = (await GroupRef).data().groupimg;

    const groupMembersRef = db
      .collection("Group calendar")
      .doc(selectedGroup)
      .collection("그룹원");
    const groupMembersSnapshot = await groupMembersRef.get();

    // 여기서 그룹원 수 데이터를 가져옵니다.
    const numberOfGroupMembers = groupMembersSnapshot.size;

    const transferLeader = async () => {
      // 1. 현재 그룹의 모든 그룹원 정보 가져오기
      const membersSnapshot = await db
        .collection("Group calendar")
        .doc(selectedGroup)
        .collection("그룹원")
        .get();

      let coLeaders = [];
      let regularMembers = [];
      let allMembers = [];

      membersSnapshot.forEach((doc) => {
        const memberData = doc.data();
        allMembers.push(doc.id);

        if (memberData.power === "공동 리더") {
          // 'power'이 멤버의 역할(리더, 공동리더, 일반멤버)을 나타내는 필드라고 가정합니다.
          coLeaders.push(doc.id); // doc.id는 멤버의 email을 나타냅니다.
        } else if (memberData.power === "멤버") {
          regularMembers.push(doc.id);
        }
      });

      const sendNotification = async (newLeaderEmail) => {
        await db
          .collection("users")
          .doc(newLeaderEmail)
          .collection("알림")
          .doc(`리더 권한 위임 알림`)
          .set({
            name: selectedGroup,
            writer: currentUserName,
            profileImageUrl: groupimg,
            force: false, //강제성
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            match: "리더 권한 위임 알림",
          });
      };

      // 2. 공동리더가 있는지 확인
      if (coLeaders.length > 0) {
        await db
          .collection("Group calendar")
          .doc(selectedGroup)
          .collection("그룹원")
          .doc(coLeaders[0])
          .update({
            power: "리더",
          });

        await sendNotification(coLeaders[0]);
      } else if (regularMembers.length > 0) {
        // 3. 그룹원 중 한 명에게 리더 권한 넘기기
        await db
          .collection("Group calendar")
          .doc(selectedGroup)
          .collection("그룹원")
          .doc(regularMembers[0])
          .update({
            power: "리더",
          });

        await sendNotification(regularMembers[0]);
      } else if (allMembers.length > 0) {
        // 그 외 멤버 중 랜덤하게 한 명에게 리더 권한 넘기기
        const randomMember =
          allMembers[Math.floor(Math.random() * allMembers.length)];
        await db
          .collection("Group calendar")
          .doc(selectedGroup)
          .collection("그룹원")
          .doc(randomMember)
          .update({
            role: "리더",
          });

        await sendNotification(randomMember);
      }
    };

    if (numberOfGroupMembers === 1) {
      Alert.alert(
        "삭제 확인",
        "유일한 그룹원이십니다. 정말로 이 그룹을 삭제하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "확인",
            onPress: async () => {
              setDocIds((prevDocIds) =>
                prevDocIds.filter((doc) => doc.id !== selectedGroup)
              );

              // 그룹 이미지 URI를 가져옵니다.
              const groupimgRef = db
                .collection("Group calendar")
                .doc(selectedGroup);
              const groupimgDoc = await groupimgRef.get();
              const groupImageData = groupimgDoc.data().groupimg; // 이 부분은 그룹 이미지의 경로를 저장하는 필드의 이름에 따라 변경해야 할 수 있습니다.

              if (groupImageData) {
                // 이미지 삭제 로직
                const imageRef = firebase.storage().refFromURL(groupImageData);
                await imageRef.delete();
              }

              const groupRef = db
                .collection("Group calendar")
                .doc(selectedGroup);

              // 이 배열에 삭제하고자 하는 하위 컬렉션 이름들을 추가합니다.
              const collections = [
                "권한",
                "그룹원",
                "일정",
                "로그",
                "메모",
                "반복일정",
                "위젯",
                "Todo",
                "반복일정폴더",
              ];

              for (const collectionName of collections) {
                const collectionRef = groupRef.collection(collectionName);
                const querySnapshot = await collectionRef.get();

                for (const docSnapshot of querySnapshot.docs) {
                  await docSnapshot.ref.delete();
                }
              }

              // 이제 상위 문서 삭제
              await groupRef.delete();

              const groupSnapshot = await db.collection("users").get();

              for (let doc of groupSnapshot.docs) {
                const userId = doc.id;

                await db
                  .collection("users")
                  .doc(userId)
                  .collection("Group")
                  .doc(selectedGroup)
                  .delete();
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(
        "탈퇴 확인",
        "정말로 이 그룹을 탈퇴하시겠습니까?",
        [
          {
            text: "취소",
            style: "cancel",
          },
          {
            text: "확인",
            onPress: async () => {
              if (power === "리더") {
                // 기본 탈퇴 로직.
                await db
                  .collection("Group calendar")
                  .doc(selectedGroup)
                  .collection("그룹원")
                  .doc(currentUser.email)
                  .delete();

                await db
                  .collection("users")
                  .doc(currentUser.email)
                  .collection("Group")
                  .doc(selectedGroup)
                  .delete();

                // 리더 넘겨주는 로직
                await transferLeader();

                // 리더 탈퇴하고 다음 리더에게 알림 발송
              } else {
                await db
                  .collection("Group calendar")
                  .doc(selectedGroup)
                  .collection("그룹원")
                  .doc(currentUser.email)
                  .delete();

                await db
                  .collection("users")
                  .doc(currentUser.email)
                  .collection("Group")
                  .doc(selectedGroup)
                  .delete();

                await db
                  .collection("users")
                  .doc(Groupmanageremail)
                  .collection("알림")
                  .doc(selectedGroup + "에서 그룹 탈퇴 알림")
                  .set({
                    name: selectedGroup,
                    writer: currentUserName,
                    profileImageUrl: groupimg,
                    force: false, //강제성
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    match: "그룹 탈퇴 알림",
                  });

                setDocIds((prevDocIds) =>
                  prevDocIds.filter((doc) => doc.id !== selectedGroup)
                );
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  };

  const renderItem = gestureHandlerRootHOC(
    ({ item, index, drag, isActive }) => {
      return (
        <TouchableOpacity
          key={index}
          onLongPress={drag}
          style={
            isActive
              ? {
                  width: "90%",
                  backgroundColor: "lightgrey",
                  alignSelf: "center",
                }
              : { width: "90%", alignSelf: "center" }
          }
        >
          <View
            style={{
              width: "100%",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", width: "60%" }}>
              <View>
                <Text style={{ fontSize: 30, color: "black" }}>= </Text>
              </View>
              <Image
                source={{ uri: item.groupimg }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 50,
                  marginRight: 10,
                }}
              />
              <Text>{item.id}</Text>
            </View>

            { buttonVisible && (
              <View>
                <Switch
                  value={item.isTogether}
                  onValueChange={() => {toggleTogether(item.id, item.isTogether)}}
                  style={{ height: 24 }}
                />
              </View>
            )}

            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {item.power === "리더" ? (
                <View>
                  <Icon
                    name="spa"
                    size={25}
                    color={"rgba(229,240,104,1)"}
                  ></Icon>
                </View>
              ) : (
                <View>
                  <Text>{item.power}</Text>
                </View>
              )}
              <TouchableOpacity
                style={{
                  backgroundColor: "rgb(250, 80, 80)",
                  borderRadius: 7,
                  width: 60,
                  height: 30,
                  padding: 4,
                  alignItems: "center",
                  marginLeft: 10,
                }}
                onPress={() => QuitGroup(item.id, item.power)}
              >
                <Text>탈퇴</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      );
    }
  );

  const DraggList = gestureHandlerRootHOC(() => (
    <View>
      <DraggableFlatList
        data={docIds}
        renderItem={renderItem}
        keyExtractor={(item, index) => `draggable-item-${item.id}`}
        onDragEnd={({ data }) => {
          setDocIds(data);
          updateFirestore(data);
        }}
      />
    </View>
  ));

  const updateFirestore = async (data) => {
    const batch = db.batch();

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const newCreatedAt = Date.now() + i;

      const docRef = db
        .collection("users")
        .doc(currentUser.email)
        .collection("Group")
        .doc(item.id);

      batch.update(docRef, { created_at: newCreatedAt });
    }

    // 모든 쓰기 작업을 묶어 한 번에 처리
    await batch.commit();
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
      <View style={{ flex: 1, backgroundColor: "white" }}>
        {/* 상단 바 */}
        <View
          style={{
            paddingTop: Platform.OS === "ios" ? 54 : 24,
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderBottomWidth: 1,
            borderColor: "#e0e0e0",
            marginBottom: 10,
          }}
        >
          <TouchableOpacity style={{ width: 60 }} onPress={onClose}>
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
            그룹 편집
          </Text>

          <TouchableOpacity 
            style={{ width: 60 }}
            onPress={() => {setButtonVisible(!buttonVisible)}}
          >
            <Text>같이 보기</Text>
          </TouchableOpacity>
        </View>

        <DraggList />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  memostyle1: {
    width: 200,
    height: 40,
    backgroundColor: "lightgray",
    borderRadius: 5,
    padding: 10,
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
    height: 45,
    backgroundColor: "skyblue",
    borderRadius: 10,
    padding: 10,
  },
  registertext: {
    color: "black",
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
});
