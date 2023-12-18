import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Dashboard from "./Dashboard";
import Profile_Edit from "./Profile_Edit";
import { useSelector, useDispatch } from "react-redux";
import { selectSignatureStyles } from "../Redux/selector";

const Stack = createStackNavigator();

//대시보드창과 프로필 편집창
const DashScreen = () => {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard"
        component={Dashboard}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="프로필 편집"
        component={Profile_Edit}
        options={{
          headerTitleAlign: "center",
          headerStyle: signatureStyles
            ? signatureStyles.header
            : { backgroundColor: "black" }, // signatureStyles.header가 정의되어 있으면 사용하고, 아니면 기본 검정색을 사용
          headerTintColor:
            signatureStyles && signatureStyles.Textcolor
              ? signatureStyles.Textcolor.color
              : "white", // signatureStyles.Textcolor가 정의되어 있으면 해당 색상 사용, 아니면 흰색 사용
        }}
      />
    </Stack.Navigator>
  );
};

export default DashScreen;
