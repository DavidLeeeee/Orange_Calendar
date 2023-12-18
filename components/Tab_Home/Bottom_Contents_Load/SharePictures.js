import React, { useState, useEffect } from "react";
import { firebase } from "../../../../Afirebaseconfig";
import {
  StyleSheet,
  Text,
  View,
  Button,
  Dimensions,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  Alert,
} from "react-native";
import DeleteModal from "./Delete_Modal";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");
const itemWidth = width * 0.3; //위젯의 크기 지정을 위한 변수

export default function SharePictures({ widgets, setWidgets, selectedGroup }) {
  const userEmail = firebase.auth().currentUser.email;

  //순서 업데이트
  const onDelete_list_update = async () => {
    try {
      const widgetsRef =
        selectedGroup === "My Calendar"
          ? firebase
              .firestore()
              .collection("users")
              .doc(userEmail)
              .collection("위젯")
          : firebase
              .firestore()
              .collection("Group calendar")
              .doc(selectedGroup)
              .collection("위젯");

      const allDocs = await widgetsRef.get();
      const docNames = allDocs.docs.map((doc) => doc.id);

      console.log("Original Document names in 위젯 collection:", docNames);

      const batch = firebase.firestore().batch(); // batch 생성

      let counter = 1;
      for (let docName of docNames) {
        const parts = docName.split("_");
        const newDocId = `${counter}_${parts[1]}`;

        if (docName !== newDocId) {
          const oldDocRef = widgetsRef.doc(docName);
          const newDocRef = widgetsRef.doc(newDocId);
          const docData = await oldDocRef.get();

          batch.set(newDocRef, docData.data()); // 새 문서에 데이터 설정
          batch.delete(oldDocRef); // 기존 문서 삭제
        }

        counter++;
      }

      await batch.commit(); // batch 작업 적용

      // 사용자 문서에 widgetOrder 필드 업데이트
      const userRef = firebase.firestore().collection("users").doc(userEmail);
      await userRef.update({
        widgetOrder: counter - 1,
      });

      console.log(
        "Updated Document names in 위젯 collection:",
        Array.from(
          { length: counter - 1 },
          (_, i) => `${i + 1}_${docNames[i].split("_")[1]}`
        )
      );
    } catch (error) {
      console.error("Error updating document names using batch:", error);
    }
  };

  //모달 삭제 기능 구현하기
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const showDeleteModal = () => {
    setIsDeleteModalVisible(true);
  };
  const hideDeleteModal = () => {
    setIsDeleteModalVisible(false);
  };
  const handleDelete = async () => {
    try {
      const widgetsRef =
        selectedGroup === "My Calendar"
          ? firebase
              .firestore()
              .collection("users")
              .doc(userEmail)
              .collection("위젯")
          : firebase
              .firestore()
              .collection("Group calendar")
              .doc(selectedGroup)
              .collection("위젯");

      const allDocs = await widgetsRef.get();

      // 문서 ID의 끝 부분이 title과 일치하는 문서를 필터링
      const matchingDocs = allDocs.docs.filter((doc) => {
        const docId = doc.id;
        return docId.endsWith("사진공유함");
      });

      // 일치하는 문서들을 삭제
      for (let doc of matchingDocs) {
        await doc.ref.delete();
      }

      // 로컬 상태인 widgets에서 일치하는 항목을 제거하고, state를 업데이트
      const updatedWidgets = widgets.filter((widget) =>
        widget.id ? !widget.id.endsWith("사진공유함") : true
      );

      setWidgets(updatedWidgets);
      hideDeleteModal();

      await onDelete_list_update(); // 순서를 업데이트합니다.
    } catch (error) {
      console.error("Error deleting the widget:", error);
    }
  };

  //사진 기능 구현하기
  const [showPictureModal, setShowPictureModal] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState(null);
  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to make this work!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      // allowsEditing: true,
      // aspect: [3, 4],
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImageUri(result.uri);
      uploadImageToFirebase(result.uri); // Firebase에 업로드.
    }
  };
  const getFileNameFromUri = (uri) => {
    const parts = uri.split("/");
    return parts[parts.length - 1];
  };

  //파이어베이스에 업로드하기
  const uploadImageToFirebase = async (uri) => {
    try {
      // 1. 파일 이름 및 저장 경로 생성
      // 1. 파일 이름 및 저장 경로 생성
      const date = new Date();
      const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${date.getDate().toString().padStart(2, "0")}`;
      const originalFileName = getFileNameFromUri(uri); // uri로부터 파일 이름 추출
      const imageName = `${formattedDate}_${originalFileName}`;

      let storagePath = `SharePicture/`;

      if (selectedGroup === "My Calendar") {
        storagePath += `Users/${userEmail}/${imageName}`;
      } else {
        storagePath += `Group/${selectedGroup}/${imageName}`;
      }

      // 2. 파일 업로드 시작
      const response = await fetch(uri);
      const blob = await response.blob();
      const ref = firebase.storage().ref().child(storagePath);
      const uploadTask = ref.put(blob);

      // 3. 업로드 상태 모니터링 (옵션)
      uploadTask.on(
        firebase.storage.TaskEvent.STATE_CHANGED,
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          console.error("Image upload error: ", error);
        },
        async () => {
          // 4. 업로드 완료 후 처리 (예: Firestore에 이미지 URL 저장)
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          console.log("Image uploaded and available at: ", downloadURL);
          setSelectedImageUri(downloadURL);
          // Firestore에 저장하는 코드가 필요한 경우 여기에 추가하십시오.
          setImages([]);
          fetchImages();
        }
      );
    } catch (error) {
      console.error("Error during image upload: ", error);
    }
  };

  //firestore에서 삭제하기
  const deleteImageFromFirebase = async (imageUri) => {
    try {
      // 이미지 URI에서 Storage의 경로를 직접 사용하는 경우
      const storagePath = imageUri.split("?")[0]; // 쿼리 파라미터 제거

      // 이미지 참조 가져오기
      const imageRef = firebase.storage().refFromURL(storagePath);

      // 이미지 삭제
      await imageRef.delete();
      console.log("Image successfully deleted!");
    } catch (error) {
      console.error("Error deleting image: ", error);
    }
    // fetchImages();
    setImages((prevImages) => prevImages.filter((img) => img !== imageUri));
  };

  //이미지 불어오기
  const [images, setImages] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);

  const fetchImages = async () => {
    let storagePath = "SharePicture/";

    if (selectedGroup === "My Calendar") {
      storagePath += `Users/${userEmail}/`;
    } else {
      storagePath += `Group/${selectedGroup}/`;
    }

    const folderRef = firebase.storage().ref(storagePath);

    // 페이지네이션 적용하여 이미지 목록 가져오기
    const maxResults = 6; // 한 번에 가져올 이미지의 최대 개수

    folderRef
      .list({ maxResults, pageToken: nextPageToken })
      .then(async (result) => {
        const urls = await Promise.all(
          result.items.map((item) => item.getDownloadURL())
        );
        setImages((prevImages) => [...prevImages, ...urls]);
        setNextPageToken(result.nextPageToken);
      });
  };

  useEffect(() => {
    // images 상태 초기화
    setImages([]);
    fetchImages();
  }, []);

  //이미지 클릭시 보여주기 및 다운로드
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const showImageModal = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  //이미지 다운
  async function downloadImage(uri) {
    try {
      const permissions = await MediaLibrary.getPermissionsAsync();

      if (permissions.status !== "granted") {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          alert("Permission is required to save images to your gallery.");
          return;
        }
      }

      const fileUri =
        FileSystem.documentDirectory + new Date().getTime() + ".jpg";
      await FileSystem.downloadAsync(uri, fileUri);

      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync("Download", asset, false);

      alert("Image has been saved to your gallery!");
    } catch (error) {
      console.error("Error processing the image download:", error);
      alert("There was an issue processing your download. Please try again.");
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={styles.widgetBox}
      onLongPress={showDeleteModal}
      onPress={() => setShowPictureModal(true)} // 모달을 표시하기 위해 상태를 true로 설정
    >
      <View style={{ width: 70, height: 70 }}>
        <Image
          source={require("../../../assets/pic.png")}
          style={{
            width: 70,
            height: 70,
            position: "absolute",
            zIndex: 2,
          }}
        />
        <View
          style={{
            backgroundColor: "rgba(255,255,255,1)",
            width: 70,
            height: 70,
            borderRadius: 10,
            position: "absolute",
            zIndex: 1,
            shadowColor: "black",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3,
          }}
        ></View>
      </View>
      <DeleteModal
        isVisible={isDeleteModalVisible}
        onDelete={handleDelete}
        onClose={hideDeleteModal}
      />
      {/* 사진을 표시하는 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPictureModal}
      >
        <View style={styles.pictureModalContainer}>
          <View style={styles.pictureModalContent}>
            <View
              style={{
                marginLeft: 5,
                paddingBottom: 10,
                marginBottom: 1,
                flexDirection: "row",
                alignItems: "center",
                borderColor: "#e0e0e0",
                borderBottomWidth: 0.5,
                // iOS 그림자 스타일
                shadowColor: "#000",
              }}
            >
              {/* 모달창 닫기 버튼 */}
              <TouchableOpacity
                style={{ alignItems: "flex-end" }}
                onPress={() => setShowPictureModal(false)}
              >
                <Icon name="arrow-back" size={25} />
              </TouchableOpacity>
              <Text style={styles.modalText}>이미지</Text>
              <View style={{ width: 30 }}></View>
            </View>
            {/* 이미지 목록 */}
            <FlatList
              data={images}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    width: "40%",
                    height: undefined,
                    aspectRatio: 1,
                    marginVertical: "3%",
                    marginHorizontal: "5%",
                  }}
                  onPress={() => showImageModal(item)}
                  onLongPress={() => {
                    // 삭제 확인 대화상자 표시
                    Alert.alert(
                      "Delete Image",
                      "Are you sure you want to delete this image?",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "OK",
                          onPress: () => deleteImageFromFirebase(item), // 여기에서 삭제 함수를 호출
                        },
                      ]
                    );
                  }}
                >
                  <Image
                    source={{ uri: item }}
                    style={{
                      width: "100%",
                      height: undefined,
                      aspectRatio: 1,
                      // marginVertical: "3%",
                      // marginHorizontal: "5%",
                    }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
              numColumns={2}
              keyExtractor={(item, index) => index.toString()}
            />
            {nextPageToken && <Button title="더 보기" onPress={fetchImages} />}

            {/* 이미지를 크게 보여주는 모달 창 */}
            {modalVisible && (
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                  setModalVisible(false);
                }}
              >
                <View
                  style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "black", // 부모 View의 배경을 검정색으로 설정
                  }}
                >
                  <Image
                    source={{ uri: selectedImage }}
                    style={{ width: "80%", height: "60%" }}
                    resizeMode="contain" // 이미지의 resizeMode를 contain으로 설정
                  />

                  <View style={{ width: "70%", height: "30%", justifyContent: "space-between"}}>
                  <Text style={{ color: "white", marginVertical: 10 }}>
                    URL: {selectedImage}
                  </Text>

                    <TouchableOpacity 
                      onPress={() => {downloadImage(selectedImage)}} 
                      style={styles.downloadbutton}
                    >
                      <Text style={{ fontSize: 15 }}>이미지 다운로드</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{ alignSelf: "center" }}>
                      <Icon
                        name={"close"}
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>                  
                </View>
              </Modal>
            )}

            <TouchableOpacity 
              onPress={openImagePicker} 
              style={styles.selectbutton}
            >
              <Text style={{ fontSize: 15, color: "white" }}>이미지 업로드</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ViewBox: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "white",
  },
  widgetBox: {
    overflow: "hidden",
    padding: 0,
    width: itemWidth,
    height: 200,
    margin: (width * 0.05 - 8) / 2,
    borderRadius: 10,
    backgroundColor: "rgba(250,250,250,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  pictureModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)", // 반투명한 배경
  },
  pictureModalContent: {
    width: "90%",
    height: "90%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 10,
    bottom: 10,
  },
  downloadbutton: {
    width: "100%",

    borderRadius: 15,
    padding: 5,
    backgroundColor: "white",
    marginBottom: 20,

    alignItems: "center"
  },
  selectbutton: {
    width: "50%",

    borderRadius: 15,
    padding: 5,
    backgroundColor: "black",
    marginBottom: 20,

    alignItems: "center"
  },
  modalText: {
    flex: 1,
    textAlign: "center",
    fontWeight: "400",
    fontSize: 18,
  },
});
