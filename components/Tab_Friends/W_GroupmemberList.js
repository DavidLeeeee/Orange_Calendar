import React from "react";
import { View, ScrollView, Text } from "react-native";
import GroupmemberProfile from "./W_GroupmemberProfile";

export default (props) => {
  //권한이 리더일 경우 그룹원 관리에서 제외.
  const authority = "리더";

  return (
    <ScrollView>
      {props.data
        .filter((item) => item.power!== authority) //권한이 리더일 경우 그룹원 관리에서 제외.
        .map((item, index) => (
          <GroupmemberProfile
            key={index}
            imgurl={item.imgurl}
            name={item.name}
            email={item.email}
            profilesSize={45}
            selectedGroup={props.selectedGroup}
            component={props.component}
          />
        ))}
    </ScrollView>
  );
};