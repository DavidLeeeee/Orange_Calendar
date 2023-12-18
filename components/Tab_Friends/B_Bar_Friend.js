import { View, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import FindFriend from "./Friend_Function/Find_Friend";
import React, { useState, useEffect } from "react";
import { firebase } from "../../../Afirebaseconfig";
import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../Redux/selector";
export default () => {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);
  //   const FindFriend = () => {};
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginLeft: 15,
      }}
    >
      <Text
        style={[
          {
            fontSize: 16,
            fontWeight: "400",
          },
          signatureStyles ? signatureStyles.Textcolor : {},
        ]}
      >
        친구
      </Text>
      <View style={{ marginRight: 15, marginTop: 8 }}>
        <FindFriend />
      </View>
    </View>
  );
};

//props는 받기 위해서 넣는 명령어.
