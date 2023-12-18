import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialIcons";
import HomeScreen from "./Bottom_Tab_Contents/Home";
import FriendScreen from "./Bottom_Tab_Contents/Friends";
import ProfileScreen from "./Bottom_Tab_Contents/Profile";
import AlarmScreen from "./Bottom_Tab_Contents/Alarm";
import SettingScreen from "./Bottom_Tab_Contents/Setting";
import AdminScreen from "./Admin";
import DashScreen from "../Tab_Profile/Dashboard_StackScreen";
import { firebase } from "../../../Afirebaseconfig";
import { Dimensions, Platform } from "react-native";

import { useSelector, useDispatch } from "react-redux";
import { selectSignatureStyles } from "../Redux/selector";

//동기화용.

const Tab = createBottomTabNavigator();

export default function BottomTabNavigationApp() {
  //const [signatureStyles, setSignatureStyles] = useState(getSignatureStyles());
  const [notificationCount, setNotificationCount] = useState(0);

  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  // 로그인 상태 감지 리스너 설정
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setIsUserLoggedIn(true);
      } else {
        setIsUserLoggedIn(false);
      }
    });

    // Clean up the subscription
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebase.auth().currentUser) {
      return;
    }

    const unsubscribe = firebase
      .firestore()
      .collection("users")
      .doc(firebase.auth().currentUser.email)
      .collection("알림")
      .onSnapshot((snapshot) => {
        setNotificationCount(snapshot.size);
      });

    // const updateSignatureStyles = async () => {
    //   const fetchedStyles = await fetchAndSetSignatureColor();
    //   if (fetchedStyles) {
    //     setSignatureStyles(fetchedStyles);
    //   }
    // };

    //updateSignatureStyles();

    // Clean up the subscription when the component is unmounted
    return () => unsubscribe();
  }, [isUserLoggedIn]);

  if (!isUserLoggedIn) {
    return <ProfileScreen />;
  }

  if (firebase.auth().currentUser.email === "orangeadmin@secret.com") {
    return <AdminScreen />;
  }

  const isTablet = () => {
    let dim = Dimensions.get("screen");
    return dim.width >= 768 || dim.height >= 768; // 태블릿 크기 기준
  };

  return (
    <Tab.Navigator
      initialRouteName="Profile"
      screenOptions={{
        tabBarActiveTintColor: signatureStyles
          ? signatureStyles.Activated
          : "black",
        tabBarInactiveTintColor: signatureStyles
          ? signatureStyles.Inactivated
          : "gray",
        tabBarStyle: signatureStyles
          ? signatureStyles.footer
          : { backgroundColor: "yellow" },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "300",
            marginTop: -10, // 레이블의 상단 마진을 줄임
            ...signatureStyles?.Textcolor, // 스타일 객체 직접 펼침
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" color={color} size={28} />
          ),
          tabBarLabel: "홈",
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendScreen}
        options={{
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "300",
            marginTop: -10, // 레이블의 상단 마진을 줄임
            ...signatureStyles?.Textcolor, // 스타일 객체 직접 펼침
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="groups" color={color} size={28} />
          ),
          tabBarLabel: "소셜",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DashScreen}
        options={{
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "300",
            marginTop: -10, // 레이블의 상단 마진을 줄임
            ...signatureStyles?.Textcolor, // 스타일 객체 직접 펼침
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={28} />
          ),
          tabBarLabel: "프로필",
        }}
      />
      <Tab.Screen
        name="Notification"
        component={AlarmScreen}
        options={{
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "300",
            marginTop: -10, // 레이블의 상단 마진을 줄임
            ...signatureStyles?.Textcolor, // 스타일 객체 직접 펼침
          },
          tabBarIcon: ({ color, size }) => (
            <Icon name="notifications" color={color} size={24} />
          ),
          tabBarBadge: notificationCount > 0 ? notificationCount : null,
          tabBarBadgeStyle: {
            backgroundColor: "red", // 뱃지 배경 색상 지정
            color: "white", // 뱃지 글자 색상 지정 (옵션)
            // 추가적인 스타일 속성들을 여기에 넣을 수 있습니다.
          },
          tabBarLabel: "알림",
        }}
      />
    </Tab.Navigator>
  );
}
