import React from "react";
import { Image, View, Text } from "react-native";

export default FreindProfile = (props) => {
  return (
    <View>
      <View style={{ flexDirection: "row", marginHorizontal: 15 }}>
        <Image
          source={{ uri: props.uri }}
          style={{
            width: props.profilesSize,
            height: props.profilesSize,
            borderRadius: 50,
          }}
        />
        <View style={{ padding: 5 }}></View>

        <View style={{ justifyContent: "center", marginleft: 10 }}>
          <Text style={{ fontWeight: "bold", fontSize: 16 }}>{props.name}</Text>
          <Text style={{ color: "grey", fontSize: 12 }}>
            {props.introduction}
          </Text>
        </View>
      </View>

      <View style={{ padding: 10 }}></View>
    </View>
  );
};

//Profile 안에 porps가 세 가지 있다 uri, name, profileSize. 고로 Profile을 다른 js에서 쓸 때 세 가지 props를 넘겨줘야된다!
//import가 있으면 export가 있어야 한다.
