import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Image, Modal } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { firebase } from "../../../Afirebaseconfig";
import { FlatList } from "react-native-gesture-handler";

export default BusyShowingTab = (props) => {
    const db = firebase.firestore();
    const currentUser = firebase.auth().currentUser;

    const [docIds, setDocIds] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const openModalForItem = (itemId) => {
        setSelectedItemId(itemId);
        setModalVisible(true);
      };
  
    const fetchGroupData = async () => {
        const groupRef = db
            .collection("Group calendar")
            .doc(props.selectedGroup)
            .collection("그룹원")
    
        groupRef.onSnapshot(async (groupSnapshot) => {
            let groups = [];
    
        for (let doc of groupSnapshot.docs) {
            const memberemail = doc.id;
            const membername = doc.data().name;
            const memberImage = doc.data().imgurl;
            const created_at = doc.data().created_at;

            const stateRef = await db
                .collection("Group calendar")
                .doc(props.selectedGroup)
                .collection("그룹원")
                .doc(memberemail)
                .collection(props.datedata)
                .doc(props.datedata)
                .get();

            const userState = !stateRef.exists ? null : stateRef.data().busy === null ? null : stateRef.data().busy;
            console.log(userState)

            let reason;
            let comment;

            if(userState === true) {
                if(stateRef.data().reason !== undefined) {
                    reason = stateRef.data().reason;
                }
            }else if(userState === false) {
                if(stateRef.data().comment !== undefined) {
                    comment = stateRef.data().comment;
                }
            }

            groups.push({
                id: memberemail,
                name: membername,
                memberimg: memberImage,
                created_at: created_at,
                userState: userState,
                reason: reason,
                comment: comment,
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
                <FlatList
                    data={docIds}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={{
                            width: "100%",
                            flexDirection: "row",
                            marginBottom: 20,
                        }}>
                            <View style={{ flexDirection: "row", alignItems: "center", position: 'relative' }}>
                                <Image
                                    source={{ uri: item.memberimg }}
                                    style={{
                                        width: 50,
                                        height: 50,
                                        borderRadius: 50,
                                        marginRight: 10,
                                    }}
                                />

                                <View
                                    style={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: 10,
                                        backgroundColor: item.userState === true ? 'red' : item.userState === false ? '#00FF40' : 'grey',
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        borderWidth: 2, // 옵션: 이미지와 상태 표시를 구분하기 위한 테두리
                                        borderColor: 'white' // 옵션: 배경색과 대비되는 테두리 색상
                                    }}
                                />
                            </View>

                            <View style={{ alignItems: "center", justifyContent: "center", marginHorizontal: 10}}>
                                <Text>{item.name}</Text>
                            </View>

                            <View style={{ width: 200, justifyContent: "center", marginHorizontal: 10}}>
                                {(item.userState === true && item.reason !== undefined) && (
                                    <TouchableOpacity onPress={() => openModalForItem(item.id)}>
                                        <Text numberOfLines={1}>{item.reason}</Text>
                                    </TouchableOpacity>
                                )}
                                {(item.userState === false && item.comment !== undefined) && (
                                    <TouchableOpacity onPress={() => openModalForItem(item.id)}>
                                        <Text numberOfLines={1}>{item.comment}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {selectedItemId && modalVisible && (
                                <Modal
                                    transparent={true}
                                    visible={modalVisible}
                                    onRequestClose={() => {
                                        setModalVisible(!modalVisible);
                                    }}
                                >
                                    <View style={styles.centeredView}>
                                    <View style={styles.modalView}>
                                        <TouchableOpacity
                                        style={{ padding: 10 }}
                                        onPress={() => {
                                            setModalVisible(!modalVisible);
                                        }}
                                        >
                                        <Icon
                                            name="close"
                                            size={25}
                                            color={"#000"}
                                        />
                                        </TouchableOpacity>

                                        <View>
                                            <Text>{docIds.find(item => item.id === selectedItemId)?.userState === true ? '미참가 사유' : '코멘트'}</Text>
                                            <Text style={{ ...styles.modalcontentText, marginHorizontal: 10 }}>
                                                {docIds.find(item => item.id === selectedItemId)?.userState === true ? docIds.find(item => item.id === selectedItemId)?.reason : docIds.find(item => item.id === selectedItemId)?.comment}
                                            </Text>
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
    modalView: {
        margin: 20,
        backgroundColor: "white",
        //borderRadius: 20,
        width: "80%",
        height: 200,
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
      },
      modalcontentText: {
        fontSize: 16,
        borderRadius: 5,
        marginTop: 5,
        overflow: "hidden",
      },
  });