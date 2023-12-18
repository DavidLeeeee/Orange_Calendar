import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Switch, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";
import { FlatList, TextInput } from "react-native-gesture-handler";
import { Image } from "expo-image";

export default BusyCheckingTab = (props) => {
    const db = firebase.firestore();
    const currentUser = firebase.auth().currentUser;

    const [docIds, setDocIds] = useState([]);

    const [modalVisible, setModalVisible] = useState(false);
    const [reasonModalVisible, setReasonModalVisible] = useState(false);
    const [commentModalVisible, setCommentModalVisible] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState(null);

    const [reason, setReason] = useState("");
    const [comment, setComment] = useState("");

    const openModalForItem = (itemId) => {
        setSelectedItemId(itemId);
        setModalVisible(true);
    };
  
    const fetchGroupData = async () => {
        const groupRef = db
            .collection("users")
            .doc(currentUser.email)
            .collection("Group");
    
        groupRef.onSnapshot(async (groupSnapshot) => {
            let groups = [];
    
        for (let doc of groupSnapshot.docs) {
            const groupId = doc.id;
            const groupImage = doc.data().groupimg;
            const created_at = doc.data().created_at;

            const stateRef = await db
                .collection("Group calendar")
                .doc(groupId)
                .collection("그룹원")
                .doc(currentUser.email)
                .collection(props.datedata)
                .doc(props.datedata)
                .get();

            const userState = !stateRef.exists ? null : stateRef.data().busy === null ? null : stateRef.data().busy;

        groups.push({
                id: groupId,
                groupimg: groupImage,
                created_at: created_at,
                userState: userState,
            });
        }
    
        groups.sort((a, b) => {
            if (a.created_at < b.created_at) return -1;
            if (a.created_at > b.created_at) return 1;
            return 0;
        });
    
          setDocIds(groups);
        });
    };
    
    useEffect(() => {
        fetchGroupData();
    }, []);

    const updateState = (groupName, busystate, isSkip) => {
        console.log(groupName);

        if(busystate === true && !isSkip) {
            db.collection("Group calendar")
                .doc(groupName)
                .collection("그룹원")
                .doc(currentUser.email)
                .collection(props.datedata)
                .doc(props.datedata)
                .set({
                    busy: busystate,
                    reason: reason,
                })
        }else if(busystate === false && !isSkip) {
            db.collection("Group calendar")
                .doc(groupName)
                .collection("그룹원")
                .doc(currentUser.email)
                .collection(props.datedata)
                .doc(props.datedata)
                .set({
                    busy: busystate,
                    comment: comment,
                })
        }else {
            db.collection("Group calendar")
                .doc(groupName)
                .collection("그룹원")
                .doc(currentUser.email)
                .collection(props.datedata)
                .doc(props.datedata)
                .set({
                    busy: busystate,
                })
        }
    }

    return (
        <View
            style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <View
                style={{
                    borderTopWidth: 0.5,
                    width: "100%",
                    height: 450,
                    padding: 15,
                }}
            >
                {/* 참가 중인 그룹들 표시. */}
                <FlatList
                    key={docIds}
                    data={docIds}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View
                            style={{
                                width: "100%",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                marginBottom: 20,
                            }}
                        >
                            <View style={{ flexDirection: "row", alignItems: "center", width: "60%" }}>
                                <Image
                                    source={{ uri: item.groupimg }}
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 50,
                                        marginRight: 10,
                                    }}
                                />

                                <Text>{item.id}</Text>
                            </View>

                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <TouchableOpacity
                                    onPress={() => {openModalForItem(item.id)}}
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 12,
                                        backgroundColor: item.userState === true ? 'red' : item.userState === false ? '#00FF40' : 'grey'
                                    }} >
                                </TouchableOpacity>
                            </View>

                            {selectedItemId && (
                                <Modal
                                    transparent={true}
                                    visible={modalVisible}
                                    onRequestClose={() => {
                                        setModalVisible(!modalVisible);
                                    }}
                                >
                                    <View style={styles.centeredView}>
                                        <View style={styles.busymodalView}>
                                            <View style={{ width: "60%", flexDirection: 'row', justifyContent: 'space-between' }}>
                                                <TouchableOpacity onPress={() => {
                                                    setReasonModalVisible(!reasonModalVisible);
                                                }}>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'red' }} />
                                                </TouchableOpacity>

                                                <TouchableOpacity onPress={() => {
                                                    setCommentModalVisible(!commentModalVisible);
                                                }}>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#00FF40' }} />
                                                </TouchableOpacity>

                                                <TouchableOpacity onPress={() => {{
                                                    updateState(selectedItemId, null)}
                                                    setModalVisible(!modalVisible)
                                                    fetchGroupData();
                                                }}>
                                                    <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'grey' }} />
                                                </TouchableOpacity>
                                            </View>
                                            {/* 기존 모달 내용 */}
                                        </View>
                                    </View>
                                </Modal>
                            )}

                            {selectedItemId && (
                                <Modal
                                    transparent={true}
                                    visible={reasonModalVisible}
                                    onRequestClose={() => {
                                        setReasonModalVisible(!reasonModalVisible);
                                    }}
                                >
                                    <View style={styles.centeredView}>
                                        <View style={styles.busytextinput}>
                                            <TextInput
                                                style={{
                                                    width: "80%",
                                                    borderBottomWidth: 0.5,
                                                    marginTop: 10,
                                                    fontSize: 15,
                                                }}
                                                value={reason}
                                                onChangeText={setReason}
                                                placeholder={"사유 작성"}
                                                placeholderTextColor="grey"
                                            />

                                            <View style={{ flexDirection: "row" }}>
                                            <TouchableOpacity 
                                                style={{ width: 100, borderWidth: 0.8, borderRadius: 10, padding: 5, alignItems: "center" }}
                                                onPress={() => {
                                                    setModalVisible(!modalVisible)
                                                    setReasonModalVisible(!reasonModalVisible);
                                                    updateState(selectedItemId, true)
                                                    fetchGroupData();
                                                    setReason("");
                                                }}
                                            >
                                                <Text>바쁨 등록</Text>
                                            </TouchableOpacity>
                                            <View style={{ padding: 5}}></View>
                                            <TouchableOpacity 
                                                style={{ width: 100, borderWidth: 0.8, borderRadius: 10, padding: 5, alignItems: "center" }}
                                                onPress={() => {
                                                    setModalVisible(!modalVisible)
                                                    setReasonModalVisible(!reasonModalVisible);
                                                    updateState(selectedItemId, true, true)
                                                    fetchGroupData();
                                                    setReason("");
                                                }}
                                            >
                                                <Text>건너뛰기</Text>
                                            </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </Modal>
                            )}

                            {selectedItemId && (
                                <Modal
                                    transparent={true}
                                    visible={commentModalVisible}
                                    onRequestClose={() => {
                                        setCommentModalVisible(!commentModalVisible);
                                    }}
                                >
                                    <View style={styles.centeredView}>
                                        <View style={styles.busytextinput}>
                                            <TextInput
                                                style={{
                                                    width: "80%",
                                                    borderBottomWidth: 0.5,
                                                    marginTop: 10,
                                                    fontSize: 15,
                                                }}
                                                value={comment}
                                                onChangeText={setComment}
                                                placeholder={"코멘트 작성"}
                                                placeholderTextColor="grey"
                                            />

                                            <View style={{ flexDirection: "row" }}>
                                            <TouchableOpacity 
                                                style={{ width: 100, borderWidth: 0.8, borderRadius: 10, padding: 5, alignItems: "center" }}
                                                onPress={() => {
                                                    setModalVisible(!modalVisible)
                                                    setCommentModalVisible(!commentModalVisible);
                                                    updateState(selectedItemId, false)
                                                    fetchGroupData();
                                                    setComment("");
                                                }}
                                            >
                                                <Text>코멘트 등록</Text>
                                            </TouchableOpacity>
                                            <View style={{ padding: 5}}></View>
                                            <TouchableOpacity 
                                                style={{ width: 100, borderWidth: 0.8, borderRadius: 10, padding: 5, alignItems: "center" }}
                                                onPress={() => {
                                                    setModalVisible(!modalVisible)
                                                    setCommentModalVisible(!commentModalVisible);
                                                    updateState(selectedItemId, false, true)
                                                    fetchGroupData();
                                                    setComment("");
                                                }}
                                            >
                                                <Text>건너뛰기</Text>
                                            </TouchableOpacity>
                                            </View>
                                        </View>
                                    </View>
                                </Modal>
                            )}
                        </View>
                    )}
                />
            </View>
        </View>
    );
  };
  
const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
        backgroundColor: "rgba(0,0,0,0.1)",
    },
    busycenteredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: "white",
        //borderRadius: 20,
        width: "90%",
        height: 500,
        padding: 0,
        alignItems: "center",
    
        shadowColor: "#000",
        shadowOffset: {
        width: 0,
        height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    
        justifyContent: "space-between",
    },
    busymodalView: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        width: "50%",
        height: 100,
        padding: 0,
        alignItems: "center",
        justifyContent: "center",
    },  
    busytextinput: {
        margin: 20,
        backgroundColor: "white",
        borderRadius: 20,
        width: "60%",
        height: 120,
        padding: 10,
        alignItems: "center",
        justifyContent: "space-between",
    }
});
  