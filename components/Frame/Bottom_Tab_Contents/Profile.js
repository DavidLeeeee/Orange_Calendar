import React from "react";
import { StyleSheet, Text, View, Button } from "react-native";
import Login from "../../Tab_Profile/Login";
import Dashboard from "../../Tab_Profile/Dashboard";
import Profile_Body from "../../Tab_Profile/Profile_Body";
import Register from "../../Tab_Profile/Register";

export default function Profile() {
  return (
    <View style={{ flex: 1 }}>
      <Profile_Body />
    </View>
  );
}
