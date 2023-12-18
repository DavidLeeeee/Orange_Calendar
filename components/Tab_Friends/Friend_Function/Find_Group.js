import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Button,
  Image,
} from "react-native";
import { firebase } from "../../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Find_Group() {
  const [modalVisible, setModalVisible] = useState(false);

  // 그룹 찾기 관련
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const searchGroups = async () => {
    try {
      const querySnapshot = await firebase
        .firestore()
        .collection("Group calendar")
        .where("groupcode", ">=", searchQuery)
        .where("groupcode", "<=", searchQuery + "\uf8ff")
        .get();
      const results = querySnapshot.docs.map((doc) => doc.data());
      const filteredResults = results.filter((group) => {
        const user = firebase.auth().currentUser;
        const userRef = firebase
          .firestore()
          .collection("users")
          .doc(user.email);
        const groupRef = userRef.collection("Group").doc(group.groupName);
        return !groupRef.exists;
      });
      setSearchResults(filteredResults);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          Alert.alert("Modal has been closed.");
          setModalVisible(!modalVisible);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <TouchableOpacity
              onPress={() => setModalVisible(!modalVisible)}
              style={{ alignItems: "flex-end" }}
            >
              <Icon name="close" size={25}></Icon>
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text style={styles.modalText}>그룹 찾기</Text>
              <TextInput
                value={searchQuery}
                style={styles.textInput}
                placeholder="그룹의 이름 입력"
                placeholderTextColor="#BBB"
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Button onPress={searchGroups} title="Search" />
              <View style={{ padding: 5 }}></View>
              <FlatList
                data={searchResults}
                keyExtractor={(group) => group.groupName}
                renderItem={({ item: group }) => {
                  const user = firebase.auth().currentUser;
                  const userRef = firebase
                    .firestore()
                    .collection("users")
                    .doc(user.email);
                  const groupRef = userRef
                    .collection("Group")
                    .doc(group.groupName);
                  return (
                    <View key={group.groupName}>
                      <View
                        style={{
                          width: "88%",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                          borderBottomWidth: 1,
                          borderBottomColor: "#ccc",
                          paddingVertical: 2,
                        }}
                      >
                        {group.groupimg ? (
                          <Image
                            source={{ uri: group.groupimg }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 50,
                            }}
                          />
                        ) : (
                          <Text>No Image?</Text>
                        )}
                        <Text>{group.groupName}</Text>
                        {/* Render different component if group is already added */}
                        {groupRef.exists ? (
                          <Text>Already added</Text>
                        ) : (
                          <Button
                            onPress={() => {
                              // Add group to authenticated user's "Group" sub-collection
                              groupRef.set({
                                groupName: group.groupName,
                              });
                            }}
                            title="Add"
                          />
                        )}
                      </View>
                    </View>
                  );
                }}
              />
              <View style={{ padding: 10 }}></View>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: "grey",
            alignContent: "center",
          }}
        >
          그룹 찾기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    padding: 12,
    backgroundColor: "skyblue",
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 20,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    width: "80%",
    height: "80%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: "center",
  },
  friendList: {
    width: "100%",
    backgroundColor: "lightgray",
    borderRadius: 5,
    padding: 10,
  },
  textInput: {
    paddingTop: 20,
    paddingBottom: 10,
    width: "100%",
    fontSize: 20,
    borderBottomColor: "#000",
    borderBottomWidth: 1,
    marginBottom: 10,
    textAlign: "center",
  },
});
