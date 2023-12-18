import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { firebase } from "../../../../Afirebaseconfig";
import "firebase/firestore";
import "firebase/storage";
import Icon from "react-native-vector-icons/MaterialIcons";

import { useSelector, useDispatch } from "react-redux";
import { updateSignatureColor } from "../../Redux/signatureColorSlice";
import { selectSignatureStyles } from "../../Redux/selector";

const LoadGroup = () => {
  // Redux 상태에서 스타일을 가져옵니다.
  const signatureStyles = useSelector(selectSignatureStyles);

  const [groups, setGroups] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState([]);
  const [memberdata, setMemberdata] = useState([]);
  const [logdata, setLogdata] = useState([]);
  const [powerdata, setPowerdata] = useState([]);
  const [authorityList, setAuthorityList] = useState([]);

  const [lastVisibleLog, setLastVisibleLog] = useState(null); // 마지막 로그 문서의 참조를 저장
  const [showMoreButton, setShowMoreButton] = useState(true);

  const db = firebase.firestore();

  const handleButtonPress = (group) => {
    selectGroup(group);
    setModalVisible(true);
  };

  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

  const handlePress = (event) => {
    const layout = event.nativeEvent;
    setButtonPosition({ x: layout.pageX, y: layout.pageY });
  };

  const closeModal = () => {
    setSelectedGroup([]);
    setModalVisible(false);
  };

  const selectGroup = (group) => {
    setSelectedGroup(group);
    setLogdata([]); // 이 부분을 추가하여 로그 데이터 초기화
    setLastVisibleLog(null); // 마지막 로그 문서도 초기화
    LoadLog(group);
  };

  const loadGroupData = () => {
    try {
      const userId = firebase.auth().currentUser.email;
      const userRef = firebase.firestore().collection("users").doc(userId);
      const groupRef = userRef.collection("Group");

      const unsubscribe = groupRef.onSnapshot(async (groupSnapshot) => {
        if (!groupSnapshot.empty) {
          const groupData = [];

          for (const doc of groupSnapshot.docs) {
            const data = doc.data();
            const groupName = data.groupName;

            if (groupName) {
              const groupCalendarRef = firebase
                .firestore()
                .collection("Group calendar")
                .doc(groupName);
              const groupCalendarSnapshot = await groupCalendarRef.get({
                fields: ["groupimg"],
              });

              if (groupCalendarSnapshot.exists) {
                const groupImgUrl = groupCalendarSnapshot.data().groupimg;
                data.groupimg = groupImgUrl;
              }
            }

            groupData.push(data);
          }

          // 그룹의 각 created_at에 따라 정렬. sort함수
          groupData.sort((a, b) => {
            if (a.created_at < b.created_at) return -1; // If you want ascending order, swap -1 and 1
            if (a.created_at > b.created_at) return 1;
            return 0;
          });

          setGroups(groupData);
        } else {
          setGroups([]);
        }
      });

      return () => unsubscribe(); // Cleanup the listener when the component is unmounted
    } catch (error) {
      console.log("Error loading group data:", error);
    }
  };

  const LoadMember = async (group) => {
    db.collection("Group calendar")
      .doc(group.groupName)
      .collection("그룹원")
      .orderBy("created_at", "desc")
      .onSnapshot(
        async (querySnapshot) => {
          const updatedDataPromises = querySnapshot.docs.map((doc) => {
            return db.collection("users").doc(doc.data().email).get();
          });

          // 모든 유저 정보를 가져오는 Promise를 실행
          const userInfos = await Promise.all(updatedDataPromises);

          // 이제 모든 유저 정보가 준비되었으므로, updatedData에 추가
          const updatedData = userInfos
            .map((userInfoDoc, index) => {
              if (!userInfoDoc.exists) {
                console.log("No user data found!");
                return null;
              }
              const userInfo = userInfoDoc.data();
              const userDoc = querySnapshot.docs[index];
              return {
                name: userInfo.UserName,
                email: userInfo.email,
                power: userDoc.data().power,
                imgurl: userInfo.imgurl,
              };
            })
            .filter(Boolean); // null 값을 필터링

          setMemberdata(updatedData);
        },
        (error) => {
          console.error("Error loading members:", error);
        }
      );
  };

  const LoadAuthority = async (group) => {
    try {
      const docRef = await db
        .collection("Group calendar")
        .doc(group.groupName)
        .collection("권한")
        .orderBy("created_at") // created_at 필드를 기준으로 오름차순 정렬
        .get();

      const newAuthorityList = [];

      docRef.forEach((doc) => {
        // 문서의 ID(이름)를 배열에 추가합니다.
        const authorityName = doc.id;
        newAuthorityList.push(authorityName);
      });

      setAuthorityList(newAuthorityList);
      console.log("GroupAuthority: ", authorityList);
    } catch (error) {
      console.error("Error getting authority: ", error);
    }
  };

  const LoadLog = async (group, startAfterDoc = null, append = false) => {
    try {
      let query = db
        .collection("Group calendar")
        .doc(group.groupName)
        .collection("로그")
        .orderBy("timestamp", "desc")
        .limit(5);

      if (startAfterDoc) {
        query = query.startAfter(startAfterDoc);
      }

      const querySnapshot = await query.get();
      const updatedData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const timestamp = data.timestamp;

        if (timestamp) {
          // timestamp가 존재하고 null/undefined가 아닌 경우만 처리
          const date = timestamp.toDate();
          const year = date.getFullYear(); // 년도
          const month = date.getMonth() + 1; // 달 (0부터 시작하기 때문에 1을 더합니다.)
          const day = date.getDate(); // 일
          const hours = date.getHours(); // 시
          const minutes = date.getMinutes(); // 분

          const datedata = `${year}-${month}-${day} ${hours}:${minutes}`;
          console.log(datedata);

          updatedData.push({
            date: data.date,
            writtendate: datedata,
            name: data.name,
            content: data.content,
          });
        } else {
          console.error(`문서 ${doc.id}에 timestamp가 없거나 null입니다.`);
        }
      });

      setLogdata(append ? [...logdata, ...updatedData] : updatedData);

      const lastVisibleDocument =
        querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisibleLog(lastVisibleDocument);

      if (querySnapshot.docs.length < 5) {
        setShowMoreButton(false);
      } else {
        setShowMoreButton(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const groupLogsByDate = (logs) => {
    return logs.reduce((acc, log) => {
      const dateWithoutTime = log.writtendate.split(" ")[0];
      if (!acc[dateWithoutTime]) {
        acc[dateWithoutTime] = [];
      }
      acc[dateWithoutTime].push(log);
      return acc;
    }, {});
  };

  const groupedLogs = groupLogsByDate(logdata);

  useEffect(() => {
    const handleAuthStateChanged = (user) => {
      if (user) {
        loadGroupData();
      } else {
        setGroups([]);
      }
    };

    const unsubscribe = firebase
      .auth()
      .onAuthStateChanged(handleAuthStateChanged);

    return () => unsubscribe();
  }, []);

  if (groups.length === 0) {
    return <View>{/* <Text>현재 등록된 그룹이 없습니다.</Text> */}</View>;
  }

  return (
    <View>
      {groups.map((group, index) => (
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
          <View style={{ flex: 1 }}>
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
          </View>
          <View style={{ flex: 4, paddingLeft: 0 }}>
            <Text
              style={[
                { fontSize: 16, fontWeight: "400" },
                signatureStyles ? signatureStyles.Textcolor : {},
              ]}
            >
              {group.groupName}
            </Text>
          </View>

          <View
            style={{
              width: 32,
              height: 32,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPressIn={(e) => {
                setLogdata([]);
                handlePress(e);
                handleButtonPress(group);
                LoadMember(group);
                LoadLog(group);
                LoadAuthority(group);
                // LoadPower(group);
              }}
            >
              <Icon
                name="more-vert"
                size={25}
                style={[signatureStyles ? signatureStyles.Textcolor : {}]}
              />
            </TouchableOpacity>
          </View>

          <Modal
            animationType="fade"
            transparent={true}
            visible={modalVisible}
            onRequestClose={closeModal}
          >
            {/* <TouchableWithoutFeedback onPress={closeModal}> ScrollView에 방해되서 뺼까 생각중.*/}
            {/* 이 바깥 View가 flex: 1로 있어야 TouchableWithoutFeedback이 작동 */}
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.2)",
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 350,
                  height: "70%",
                  borderWidth: 0.3,
                  borderRadius: 10,
                  backgroundColor: "white",
                }}
              >
                <View
                  style={{
                    paddingTop: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: "#e0e0e0",
                    marginBottom: 10,
                  }}
                >
                  {/* 모달 닫기 버튼. */}
                  <TouchableOpacity
                    style={{ alignSelf: "flex-end", padding: 0 }}
                    onPress={() => setModalVisible(!modalVisible)}
                  >
                    <Icon name="arrow-back" size={25}></Icon>
                  </TouchableOpacity>
                  <Text
                    style={{
                      flex: 1,
                      textAlign: "center",
                      fontWeight: "400",
                      fontSize: 18,
                    }}
                  >
                    {selectedGroup.groupName}
                  </Text>
                  <View style={{ width: 25 }}></View>
                </View>

                <View style={{ flex: 1, padding: 10, borderRadius: 5 }}>
                  <Text>그룹원 목록</Text>

                  {/* 예상 권한 목록 (이를 실제 권한 목록에 맞게 변경하세요) */}
                  <ScrollView
                    style={{
                      backgroundColor: "rgba(250,250,250,1)",
                      width: "100%",
                      height: "40%",
                      borderRadius: 10,
                    }}
                  >
                    {authorityList.map((powerType) => (
                      <View key={powerType}>
                        <Text style={{ fontWeight: "bold", marginTop: 10 }}>
                          {powerType}
                        </Text>
                        {memberdata
                          .filter((member) => member.power === powerType)
                          .map((member, index) => (
                            <View
                              key={index}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginVertical: 5,
                              }}
                            >
                              <Image
                                source={{ uri: member.imgurl }}
                                style={{
                                  width: 30,
                                  height: 30,
                                  borderRadius: 15,
                                }}
                              />
                              <Text style={{ marginLeft: 10 }}>
                                {member.name}
                              </Text>
                            </View>
                          ))}
                      </View>
                    ))}
                  </ScrollView>

                  <Text>그룹 로그</Text>
                  <ScrollView
                    style={{
                      backgroundColor: "rgba(250,250,250,1)",
                      borderRadius: 10,
                      width: "100%",
                      height: "60%",
                    }}
                  >
                    {Object.keys(groupedLogs)
                      .sort()
                      .reverse()
                      .map((writtendate) => (
                        <View key={writtendate}>
                          <Text style={styles.boldText}>
                            작성일: {writtendate}
                          </Text>
                          {groupedLogs[writtendate]
                            .sort((a, b) => {
                              const timeA = new Date(a.writtendate).getTime();
                              const timeB = new Date(b.writtendate).getTime();
                              return timeB - timeA; // 로그 내 시간별 정렬
                            })
                            .map((log, index) => (
                              <View key={index}>
                                <Text style={styles.contentText}>
                                  {log.content}
                                </Text>
                                <View
                                  style={{
                                    paddingLeft: 3,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingBottom: 4,
                                  }}
                                >
                                  <Text style={styles.infoText}>작성자 :</Text>
                                  <Text style={styles.nameDateText}>
                                    {log.name}
                                  </Text>
                                  <Text style={{ paddingHorizontal: 4 }}>
                                    {/* Add spacing here */}
                                  </Text>
                                  <Text style={styles.infoText}>
                                    일정 날짜 :
                                  </Text>
                                  <Text style={styles.nameDateText}>
                                    {log.date} {log.writtendate.split(" ")[1]}
                                  </Text>
                                </View>
                              </View>
                            ))}
                        </View>
                      ))}

                    {showMoreButton && (
                      <TouchableOpacity
                        style={{ alignItems: "center" }}
                        onPress={() =>
                          LoadLog(selectedGroup, lastVisibleLog, true)
                        }
                      >
                        <Text>더 보기</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              </View>
            </View>
            {/* </TouchableWithoutFeedback> */}
          </Modal>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  boldText: {
    paddingTop: 4,
    fontSize: 15,
    fontWeight: "500",
  },
  contentText: {
    paddingVertical: 2,
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(0, 0, 0, 0.7)",
    textShadowColor: "rgba(0, 0, 0, 0.7)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 1,
  },
  infoText: {
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(0, 0, 0, 1)",
  },

  nameDateText: {
    fontSize: 12,
    fontWeight: "300",
    color: "rgba(0, 0, 0, 0.7)",
  },
});

export default LoadGroup;
