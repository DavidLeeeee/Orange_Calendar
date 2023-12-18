import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  Button,
  ActionSheetIOS,
  Animated,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Dimensions,
  TouchableWithoutFeedback,
} from "react-native";
import { firebase } from "../../../../Afirebaseconfig";
import "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";
import * as Notifications from "expo-notifications";

const FriendsScreen = () => {
  //Redux

  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  const windowHeight = Dimensions.get("window").height;
  const [modalVisible, setModalVisible] = useState(false);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState([]);

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const getUserInfo = async (email) => {
    try {
      const userDoc = await firebase
        .firestore()
        .collection("users")
        .doc(email)
        .get();

      if (userDoc.exists) {
        const data = userDoc.data();
        return {
          email: data.email,
          imgurl: data.imgurl,
          UserName: data.UserName,
          introduce: data.introduce,
        };
      }
    } catch (error) {
      console.log("Error getting user info: ", error);
    }
    return null;
  };

  const loadFriends = async () => {
    try {
      const userId = firebase.auth().currentUser.email;
      const friendsRef = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("friends");

      const unsubscribe = friendsRef.onSnapshot(async (snapshot) => {
        try {
          const friendsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const email = doc.data().email;
              const userInfo = await getUserInfo(email);
              return {
                email: email,
                imgurl: userInfo?.imgurl,
                UserName: userInfo?.UserName,
                introduce: userInfo?.introduce,
              };
            })
          );
          setFriends(friendsData);
          console.log(friendsData);
        } catch (error) {
          console.log("Error loading friends: ", error);
        }
      });

      return unsubscribe;
    } catch (error) {
      console.log("Error loading friends: ", error);
    }
  };

  const handleAuthStateChanged = (user) => {
    if (user) {
      loadFriends();
    }
  };

  useEffect(() => {
    const handleAuthStateChanged = (user) => {
      if (user) {
        loadFriends();
      } else {
        setFriends([]);
      }
    };

    const unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuthStateChanged);

    return () => unsubscribe();
  }, []);

  const deleteFriend = async (email) => {
    console.log(email);

    try {
      const userId = firebase.auth().currentUser.email;

      // 현재 사용자의 친구 목록에서 해당 친구를 찾아 삭제합니다.
      const UserRef = firebase
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("friends")
        .where("email", "==", email);
      const usersnapshot = await UserRef.get();
      if (usersnapshot.empty) {
        console.log("Friend not found in current user's list.");
      } else {
        const UserDoc = usersnapshot.docs[0];
        await UserDoc.ref.delete();
      }

      // 친구의 목록에서 현재 사용자를 찾아 삭제합니다.
      const FriendRef = firebase
        .firestore()
        .collection("users")
        .doc(email)
        .collection("friends")
        .where("email", "==", userId);
      const friendsnapshot = await FriendRef.get();
      if (friendsnapshot.empty) {
        console.log("Current user not found in friend's list.");
      } else {
        const FriendDoc = friendsnapshot.docs[0];
        await FriendDoc.ref.delete();
      }

      // 로컬 상태 업데이트
      closeModal();
      const newFriends = friends.filter((friend) => friend.email !== email);
      setFriends(newFriends);
    } catch (error) {
      console.log("Error deleting friend: ", error);
    }
  };

  const showFriendInfo = (email) => {
    console.log("Viewing friend info: ", email);
  };

  const modalAnimation = useRef(new Animated.Value(1)).current;

  const openModalAnimation = () => {
    Animated.timing(modalAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModalAnimation = () => {
    Animated.timing(modalAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false)); // 애니메이션이 끝나면 모달을 닫습니다.
  };

  const handleButtonPress = (friend) => {
    setSelectedFriend(friend);
    openModalAnimation(); // 여기서 애니메이션을 시작합니다.
    setModalVisible(true);
  };

  const closeModal = () => {
    closeModalAnimation(); // 애니메이션과 함께 모달을 닫습니다.
    setSelectedFriend([]);
  };

  const getGroupDocNames = async (email) => {
    try {
      const groupSnapshot = await firebase
        .firestore()
        .collection("users")
        .doc(email)
        .collection("Group")
        .get();

      return groupSnapshot.docs.map((doc) => doc.id);
    } catch (error) {
      console.log("Error getting group doc names: ", error);
      return [];
    }
  };

  const [currentUserGroupNames, setCurrentUserGroupNames] = useState([]);
  const [commonGroupNames, setCommonGroupNames] = useState([]);

  useEffect(() => {
    const loadCurrentUserGroupNames = async () => {
      const groupNames = await getGroupDocNames(
        firebase.auth().currentUser.email
      );
      setCurrentUserGroupNames(groupNames);
    };

    loadCurrentUserGroupNames();
  }, []);

  const handleButtonPress2 = async (friend) => {
    setSelectedFriend(friend);

    const friendGroupNames = await getGroupDocNames(friend.email);
    const commonGroupNames = friendGroupNames.filter((name) =>
      currentUserGroupNames.includes(name)
    );

    console.log(
      `Common groups with ${friend.email}: ${commonGroupNames.join(", ")}`
    );
    // 여기에서 필요한 작업을 수행하십시오.
    setCommonGroupNames(
      friendGroupNames.filter((name) => currentUserGroupNames.includes(name))
    );
    setModalVisible(true);
  };

  async function sendPushNotification(expoPushToken, userName, imgurl) {
    console.log(expoPushToken);

    const message = {
      to: expoPushToken,
      sound: "default",
      title: "콕 찌르기 알림",
      body: userName + "님이 회원님을 콕 찔렀습니다.",
      data: { imgurl: imgurl }, // 객체 형식으로 변경
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
  }

  const sendPushAlarm = async (friendemail) => {
    const user = firebase.auth().currentUser;

    const userRef = firebase
      .firestore()
      .collection("users")
      .doc(user.email)
      .get();

    const currentUserName = (await userRef).data().UserName;
    const currentUserImageUrl = (await userRef).data().imgurl;

    const userFriendsRef = firebase
      .firestore()
      .collection("users")
      .doc(friendemail)
      .collection("Token")
      .doc("Token")
      .get();

    // 친구가 로그인된 상태일 때. = 토큰이 있을 때만 전송.
    if ((await userFriendsRef).exists) {
      const friendToken = (await userFriendsRef).data().token;
      console.log(friendToken);

      sendPushNotification(friendToken, currentUserName, currentUserImageUrl);
    }
  };

  const sentTouch = async (friendName, friendEmail) => {
    const db = firebase.firestore();
    const userId = firebase.auth().currentUser.email;

    const userPath = await db.collection("users").doc(userId).get();
    const userName = userPath.data().UserName;
    const userImg = userPath.data().imgurl;

    await db
      .collection("users")
      .doc(friendEmail)
      .collection("알림")
      .doc(userName + "님의 콕 찌르기 알림")
      .set({
        name: userName,
        profileImageUrl: userImg,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        match: "콕 찌르기 알림",
      });

    sendPushAlarm(friendEmail);
    Alert.alert("콕 찌르기", `${friendName}님을 콕 찔렀습니다.`);
  };

  return (
    <View>
      {friends.map((friend, index) => (
        <View
          key={index}
          style={{
            width: "93%",
            flexDirection: "row",
            paddingVertical: 5,
            marginBottom: 5,
            marginLeft: 16,
            alignItems: "center",
            justifyContent: "space-between",
            borderBottomWidth: 0.3,
            borderBottomColor: "#ccc",
            marginHorizontal: 10,
          }}
        >
          {/* 친구 이미지 */}
          <View style={{ flex: 1 }}>
            <Image
              source={{ uri: friend.imgurl }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 50,
              }}
            />
          </View>

          {/* 친구 이름 */}
          <View style={{ flex: 4, paddingLeft: 0 }}>
            <Text
              style={[
                {
                  fontSize: 16,
                  fontWeight: "400",
                },
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              {friend.UserName}
            </Text>
          </View>

          {/* 친구 정보 더 보기 */}
          <View
            style={{
              width: 32,
              height: 32,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                handleButtonPress(friend);
                handleButtonPress2(friend);
              }}
            >
              <Icon
                name="more-vert"
                size={25}
                style={[signatureStyles ? signatureStyles.Textcolor : {}]}
              />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* 친구정보 모달 */}
      <Modal animationType="none" transparent={true} visible={modalVisible}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.modalContent,
                {
                  transform: [
                    {
                      translateY: modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [windowHeight * 0.7, windowHeight], // 시작: 화면의 아래 40% 위치, 끝: 화면의 아래쪽
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} style={styles.bigcontainer}>
                {selectedFriend && (
                  <View style={styles.container}>
                    <Image
                      source={{ uri: selectedFriend.imgurl }}
                      style={styles.profileImage}
                      resizeMode="cover"
                    />
                    <View>
                      <Text style={styles.name}>{selectedFriend.UserName}</Text>
                      <Text style={styles.introduce}>
                        {selectedFriend.introduce}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={1} style={styles.bigcontainer2}>
                <Text>같이 참여중인 그룹 : {commonGroupNames.join(", ")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.bigcontainer2}>
                <TouchableOpacity
                  onPress={() =>
                    sentTouch(selectedFriend.UserName, selectedFriend.email)
                  }
                  style={{ width: "100%", flexDirection: "row" }}
                >
                  <Text style={styles.AlarmText}>콕 찌르기</Text>
                  <Icon name="reply" size={22} color="rgba(20,20,20,1)" />
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.5}
                onPress={() => deleteFriend(selectedFriend.email)}
                style={styles.bigcontainer2}
              >
                <Text style={styles.deleteText}>친구 삭제</Text>
              </TouchableOpacity>
              <View style={{ flex: 0.04 }}>
                {/* 이 부분은 공백으로 둡니다. */}
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = {
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "rgba(255,255,255,1)",
    height: "30%",
    width: "100%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  //첫번째 요소
  bigcontainer: {
    flex: 0.3,
    backgroundColor: "white",
    width: "100%",
    justifyContent: "center",
    margin: 0,
    borderBottomWidth: 1, // 밑줄의 두께
    borderBottomColor: "#ccc", // 밑줄의 색상
  },
  container: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center", // 이미지와 텍스트를 세로 중앙에 정렬합니다.
    padding: 10,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 20, // 이미지와 텍스트 사이에 간격을 줍니다.
  },
  name: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 5,
  },
  introduce: {
    fontSize: 14,
    color: "gray",
    paddingLeft: 0,
  },
  //나머지 요소
  bigcontainer2: {
    flex: 0.2,
    backgroundColor: "white",
    width: "100%",
    justifyContent: "center",
    margin: 0,
    //borderBottomWidth: 1, // 밑줄의 두께
    borderBottomColor: "#EEE", // 밑줄의 색상
  },
  AlarmText: {
    color: "rgba(60,60,60,1)", // 약간 어두운 빨간색
    fontSize: 18, // 텍스트의 크기를 키웁니다.
    fontWeight: "600", // 텍스트를 굵게 표시합니다.
  },
  deleteText: {
    color: "#a94442", // 약간 어두운 빨간색
    fontSize: 18, // 텍스트의 크기를 키웁니다.
    fontWeight: "600", // 텍스트를 굵게 표시합니다.
  },
};

export default FriendsScreen;
