import React, { useState, useEffect, Suspense } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { firebase } from "../../../Afirebaseconfig";
import Login from "./Login";
import Dashboard_StackScreen from "./Dashboard_StackScreen";

const Stack = createStackNavigator();

export default function Profile_Body() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState();

  // Handle user state changes
  function onAuthStateChanged(user) {
    setUser(user);
    if (initializing) setInitializing(false);
  }
  useEffect(() => {
    const subscriber = firebase.auth().onAuthStateChanged(onAuthStateChanged);
    return subscriber;
  }, []);

  if (initializing) return null;

  // 로그인하기 전 창 구성.
  if (!user) {
    return (
      <Login />
    );
  }

  // 로그인 후 Dashboard 창.
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Dashboard_StackScreen"
        component={Dashboard_StackScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
