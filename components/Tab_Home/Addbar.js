//하단바
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Repeat from "./Addbar_members/A_Repeat";
import Memo from "./Addbar_members/B_Memo";
import Todo from "./Addbar_members/C_Todo";
import Feel from "./Addbar_members/D_Feel";
import GroupSetting from "./Addbar_members/E_GroupSetting";
import { firebase } from "../../../Afirebaseconfig";
import {
  fetchAndSetSignatureColor,
  getSignatureStyles,
} from "./SignatureColor";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../Redux/selector";

export default function Addbar(props) {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  const [qualification, setQualification] = useState(false);
  const db = firebase.firestore();

  useEffect(() => {
    //권한
    if (props.selectedGroup !== "My Calendar") {
      getqualification();
    }
  }, [props.selectedGroup]);

  //현재 사용자의 권한 불러오기 + '권한'에서 권한의 ture/false값을 불러오기
  const getqualification = async () => {
    const userId = firebase.auth().currentUser;

    const docRef1 = await db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("그룹원")
      .doc(userId.email)
      .get();
    const powerdata = docRef1.data().power;

    const docRef2 = await db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(powerdata)
      .get();
    const qualificationdata = docRef2.data().Admin;
    setQualification(qualificationdata);

    console.log("그룹 관리 권한:", qualification);
  };

  return (
    <View style={{ backgroundColor: "white" }}>
      <View style={styles.space}></View>
      <View
        style={[
          styles.container,
          signatureStyles ? signatureStyles.addbar : {},
        ]}
      >
        {/* 여기에서 signatureColor 스타일 적용 */}
        <Repeat selectedGroup={props.selectedGroup} />
        <Memo selectedGroup={props.selectedGroup} />
        <Todo selectedGroup={props.selectedGroup} />
        {props.selectedGroup === "My Calendar" ? (
          <Feel />
        ) : (
          qualification && <GroupSetting selectedGroup={props.selectedGroup} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 10,
    backgroundColor: "rgba(250,250,250,1)",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  space: {
    alignItems: "center",
  },
});
