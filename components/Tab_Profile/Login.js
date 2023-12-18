import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Animated,
  Easing,
  Platform,
} from "react-native";
import React, {
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import { firebase } from "../../../Afirebaseconfig";
import { TextInput } from "react-native-gesture-handler";
import Register from "./Register";
import Icon from "react-native-vector-icons/MaterialIcons";

import validator from "validator";
import AuthContext from "./Login_Function/AuthContext";
import Colors from "./Login_Function/Colors";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFocusedemail, setIsFocusedemail] = useState(false);
  const [isFocusedpassword, setIsFocusedpassword] = useState(false);

  const emailErrorText = useMemo(() => {
    if (email.length === 0) {
      return "";
    }
    if (email.length === 0 && isFocusedemail) {
      return "이메일을 입력해주세요.";
    }
    if (email.length > 0 && !validator.isEmail(email)) {
      return "올바른 이메일이 아닙니다.";
    }
    return null;
  }, [email, isFocusedemail]);

  const passwordErrorText = useMemo(() => {
    if (password.length === 0) {
      return "";
    }
    //비밀번호 제대로 설정한지
    if (password.length === 0 && isFocusedpassword) {
      return "비밀번호를 입력해주세요.";
    }
    if (password > 0 && password.length < 6) {
      return "비밀번호는 6자리 이상이여야합니다";
    }
    return null;
  }, [password, isFocusedpassword]);

  const signinButtonEnabled = useMemo(() => {
    return emailErrorText == null && passwordErrorText == null;
  }, [emailErrorText, passwordErrorText]);

  const signinButtonStyle = useMemo(() => {
    if (signinButtonEnabled) {
      return styles.signinButton;
    }
    return [styles.signinButton, styles.disabledSigninButton];
  }, [signinButtonEnabled]);

  //아래와 위는 같은 기능을 함
  const loginUser = async (email, password) => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      alert(error.message);
    }
  };

  //비밀번호 찾기
  const [modalVisible, setModalVisible] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const auth = firebase.auth();

  const handleForgotPassword = () => {
    if (!resetEmail) {
      alert("Please enter your email.");
      return;
    }

    auth
      .sendPasswordResetEmail(resetEmail)
      .then(() => {
        alert("Password reset email has been sent. Please check your inbox.");
        setModalVisible(false);
        setResetEmail("");
      })
      .catch((error) => {
        alert("Error sending password reset email:", error.message);
      });
  };

  const { signin, processingSignin } = useContext(AuthContext);

  //시작 로그인 애니메이션
  const logoPosition = useRef(new Animated.Value(300)).current;
  const orangePosition = useRef(new Animated.Value(-200)).current;
  const orangeOpacity = useRef(new Animated.Value(0)).current; // 투명도
  useEffect(() => {
    // 로고 애니메이션
    Animated.timing(logoPosition, {
      toValue: -20,
      duration: 1000,
      easing: Easing.elastic(1),
      useNativeDriver: false,
    }).start(() => {
      // Orange 애니메이션 (로고 애니메이션 후 실행)
      Animated.parallel([
        Animated.timing(orangeOpacity, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(orangePosition, {
          toValue: -45, // 원하는 상대적인 위치로 조정
          duration: 500,
          easing: Easing.elastic(1),
          useNativeDriver: false,
        }),
      ]).start();
    });
  }, []);

  const [registerVisible, setRegisterVisible] = useState(false);

  const closeRegisterModal = () => {
    setRegisterVisible(false);
  };

  return (
    <View
      style={{ alignItems: "center", backgroundColor: "white", height: "100%" }}
    >
      {processingSignin ? (
        <View style={styles.signingContainer}>
          <ActivityIndicator />
        </View>
      ) : (
        <>
          <View style={{ height: "10%" }}></View>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Animated.Image
              source={require("../../assets/Logo.png")}
              style={{
                transform: [{ translateX: logoPosition }],
                width: 150,
                height: 150,
              }}
            />
            <Animated.Text
              style={{
                fontWeight: "700",
                fontSize: 46,
                color: "rgba(245,150,60,1)",
                transform: [{ translateX: orangePosition }],
                opacity: orangeOpacity,
                textShadowColor: "rgba(0, 0, 0, 0.2)", // 음영의 색상
                textShadowOffset: { width: -1, height: 0 }, // 음영의 위치
                textShadowRadius: 5, // 음영의 부드러움
              }}
            >
              Orange
            </Animated.Text>
          </View>

          <View
            style={{
              width: "100%",
              backgroundColor: "white",
              borderRadius: 10,
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "55%",
            }}
          >
            <View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="lightgray"
                onChangeText={(email) => setEmail(email)}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onFocus={() => setIsFocusedemail(true)}
                onBlur={() => setIsFocusedemail(false)}
              />
              {emailErrorText && (
                <Text style={styles.errorText}>{emailErrorText}</Text>
              )}
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="lightgray"
                onChangeText={(password) => setPassword(password)}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                onFocus={() => setIsFocusedpassword(true)}
                onBlur={() => setIsFocusedpassword(false)}
              />
              {passwordErrorText && (
                <Text style={styles.errorText}>{passwordErrorText}</Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => loginUser(email, password)}
              // style={styles.button}
              style={signinButtonStyle}
              // onPress={onPressSigninButton}
              disabled={!signinButtonEnabled}
            >
              <Text style={styles.signinButtonText}>로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              style={{ marginTop: 20, alignItems: "center" }}
            >
              <Text
                style={{
                  fontWeight: "500",
                  fontSize: 14,
                  color: "rgba(0,0,0,0.6)",
                }}
              >
                비밀번호를 잊으셨나요?
              </Text>
            </TouchableOpacity>

            {/* 비밀번호 재설정 모달 */}
            <Modal
              animationType="fade"
              transparent={true}
              visible={modalVisible}
              onRequestClose={() => {
                setModalVisible(!modalVisible);
              }}
            >
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  padding: 20,
                  marginTop: Platform.OS === "ios" ? 30 : 10,
                  backgroundColor: "white",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    // iOS 그림자 스타일
                    shadowColor: "#000",
                  }}
                >
                  {/* 모달창 닫기 버튼 */}
                  <TouchableOpacity
                    style={{ width: 30 }}
                    onPress={() => {
                      setModalVisible(false);
                    }}
                  >
                    <Icon name="arrow-back" size={25} />
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    width: "100%",
                    height: "100%",
                    padding: 30,
                    backgroundColor: "white",
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="lightgray"
                    onChangeText={(text) => setResetEmail(text)}
                    value={resetEmail}
                  />
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={{
                      alignItems: "center",
                      marginTop: 20,
                      backgroundColor: "rgba(50,80,255,1)",
                      width: 300,
                      padding: 10,
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ color: "white" }}>Send Reset Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          </View>

          <TouchableOpacity
            onPress={() => setRegisterVisible(true)}
            style={styles.registerbutton}
          >
            <Text
              style={{
                fontWeight: "400",
                fontSize: 16,
              }}
            >
              회원 가입
            </Text>
          </TouchableOpacity>
          <Register
            modalVisible={registerVisible}
            onClose={closeRegisterModal}
          />
        </>
      )}
    </View>
  );
};

export default LoginPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    marginTop: 100,
  },
  textInput: {
    paddingTop: 20,
    paddingBottom: 10,
    width: 400,
    fontSize: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 10,
    textAlign: "center",
  },
  button: {
    marginTop: 50,
    height: 70,
    width: 250,
    backgroundColor: "#026efd",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  section: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.BLACK,
  },
  input: {
    marginTop: 10,
    borderBottomWidth: 1,
    width: 300,
    padding: 5,
    borderColor: Colors.GRAY,
    fontSize: 16,
  },
  errorText: {
    fontSize: 15,
    color: Colors.RED,
    marginTop: 4,
  },
  signinButton: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#026efd",
    width: 300,
    padding: 10,
    borderRadius: 5,
  },
  signinButtonText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledSigninButton: {
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "#000",
    width: 300,
    padding: 10,
    borderRadius: 5,
  },
  signingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  registerbutton: {
    alignItems: "center",
    width: 300,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "orange",
  },
});
