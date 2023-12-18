import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Switch } from "react-native";
import { firebase } from "../../../../../Afirebaseconfig";

export default function Power2(props) {
  const [memberdata, setMemberdata] = useState([]);

  const currentUser = firebase.auth().currentUser;
  const db = firebase.firestore();

  const toggleSwitch = async (selectedMember) => {
    try {
      // 만약 props.power가 '리더'인 경우
      if (props.power === "리더") {
        // 리더가 이미 있는지 확인
        const leaderSnapshot = await db
          .collection("Group calendar")
          .doc(props.selectedGroup)
          .collection("그룹원")
          .where("power", "==", "리더")
          .get();

        if (!leaderSnapshot.empty) {
          // 리더가 이미 있으면 현재 리더의 권한을 "멤버"로 바꾸기
          const currentLeader = leaderSnapshot.docs[0];
          await db
            .collection("Group calendar")
            .doc(props.selectedGroup)
            .collection("그룹원")
            .doc(currentLeader.id)
            .update({
              power: "멤버",
            });
        }
      }

      // 선택된 멤버의 권한 업데이트
      await db
        .collection("Group calendar")
        .doc(props.selectedGroup)
        .collection("그룹원")
        .doc(selectedMember)
        .update({
          power: props.power,
        });

      console.log("권한 정보가 업데이트되었습니다.");
    } catch (error) {
      console.error("권한 정보 업데이트 중 오류 발생:", error);
    }
  };

  const getGroupMember = async () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("그룹원")
      .orderBy("created_at", "desc")
      .onSnapshot(
        (querySnapshot) => {
          const updatedData = [];
          querySnapshot.forEach((doc) => {
            updatedData.push({
              name: doc.data().name,
              email: doc.data().email,
              power: doc.data().power,
            });
          });

          setMemberdata(updatedData);
        },
        (error) => {
          console.error(error);
        }
      );
  };

  useEffect(() => {
    getGroupMember();
    console.log("데이터", memberdata);
  }, [props.selectedGroup]);

  return (
    <View>
      <View style={styles.container}>
        <FlatList
          scrollEnabled={false}
          data={memberdata}
          keyExtractor={(item) => item.email} // 고유한 키 사용
          renderItem={({ item }) => (
            <View style={styles.memberItem}>
              <Text>{item.name}</Text>

              {/* value에 권한  */}
              <Switch
                value={props.power === item.power ? true : false}
                onValueChange={() => toggleSwitch(item.email)}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  memberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
