import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import FindGroup from "./Friend_Function/Find_Group";

import { firebase } from "../../../Afirebaseconfig";
import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../Redux/selector";

export default () => {
  //   const FindFriend = () => {};

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginLeft: 15,
        marginTop: 8,
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
        그룹
      </Text>
    </View>
  );
};
