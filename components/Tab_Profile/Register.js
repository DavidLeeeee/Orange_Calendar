import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { firebase } from "../../../Afirebaseconfig";
import Icon from "react-native-vector-icons/MaterialIcons";
import Colors from "./Login_Function/Colors";
import validator from "validator";

const Register = (props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordcheck, setPasswordCheck] = useState("");
  const [UserName, setUserName] = useState("");

  const [isFocusedemail, setIsFocusedemail] = useState(false);
  const [isFocusedpassword, setIsFocusedpassword] = useState(false);
  const [isFocusedname, setIsFocusedname] = useState(false);
  const [isFocusedcheck, setIsFocusedcheck] = useState(false);

  const [isCorrect, setIsCorrect] = useState("");
  const [passwordMatch, setPasswordMatch] = useState(null);

  // 이름 확인.
  const nameErrorText = useMemo(() => {
    if (UserName.length === 0 && !isFocusedname) {
      return "";
    }
    if (UserName.length === 0 && isFocusedname) {
      return "사용할 이름을 입력해주세요.";
    }
    return null;
  }, [UserName, isFocusedname]);

  // 이메일 확인.
  const emailErrorText = useMemo(() => {
    if (email.length === 0 && !isFocusedemail) {
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

  // 비밀번호 입력 확인
  const passwordErrorText = useMemo(() => {
    if (password.length === 0 && !isFocusedpassword) {
      return "";
    }
    if (password.length === 0 && isFocusedpassword) {
      if (password !== passwordcheck) {
        setIsCorrect("비밀번호가 일치하지 않습니다.");
      }
      return "비밀번호를 입력해주세요.";
    }
    if (password.length > 0 && password.length < 6) {
      if (password !== passwordcheck) {
        setIsCorrect("비밀번호가 일치하지 않습니다.");
      }
      if (password === passwordcheck) {
        setIsCorrect("비밀번호가 일치합니다.");
      }
      return "비밀번호는 6자리 이상이여야합니다";
    }
    return null;
  }, [password, isFocusedpassword]);

  // 비밀번호 재입력 확인
  const passwordcheckErrorText = useMemo(() => {
    if (passwordcheck.length === 0 && !isFocusedcheck) {
      return null;
    }
    if (passwordcheck.length === 0 && isFocusedcheck) {
      return "비밀번호를 다시 입력해주세요.";
    }
    if (password !== passwordcheck) {
      setIsCorrect("비밀번호가 일치하지 않습니다.");
      return "비밀번호가 일치하지 않습니다.";
    }
    if (password === passwordcheck) {
      setIsCorrect("비밀번호가 일치합니다.");
      return isCorrect;
    }
    return isCorrect;
  }, [passwordcheck, isFocusedcheck]);

  useEffect(() => {
    // 비밀번호가 변경될 때마다 실행
    if (passwordcheck.length === 0 && isFocusedcheck) {
      setPasswordMatch("비밀번호를 다시 입력해주세요.");
    } else if (password && passwordcheck && password === passwordcheck) {
      setPasswordMatch("비밀번호가 일치합니다.");
    } else if (passwordcheck) {
      // 비밀번호 재입력 칸에 무언가 입력된 경우에만 검사
      setPasswordMatch("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordMatch(null);
    }
  }, [password, passwordcheck, isFocusedcheck]);

  const signinButtonEnabled = useMemo(() => {
    return (
      nameErrorText == null &&
      emailErrorText == null &&
      passwordErrorText == null &&
      passwordMatch === "비밀번호가 일치합니다."
    );
  }, [nameErrorText, emailErrorText, passwordErrorText, passwordMatch]);

  const signinButtonStyle = useMemo(() => {
    if (signinButtonEnabled) {
      return styles.signinButton;
    }
    return [styles.signinButton, styles.disabledSigninButton];
  }, [signinButtonEnabled]);

  // 개인 식별 코드.
  const generateCode = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";

    for (let i = 0; i < 4; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      code += characters.charAt(randomIndex);
    }

    return code;
  };
  const code = generateCode();

  // 가입.
  const registerUser = async (email, password, UserName) => {
    await firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(() => {
        firebase
          .auth()
          .currentUser.sendEmailVerification({
            handleCodeInApp: true,
            url: "temporary1-8eec4.firebaseapp.com",
          })
          .then(() => {
            alert("Email sent");
          })
          .catch((error) => {
            Alert.alert("가입 환영 알림", "가입을 환영합니다.");
          })
          .then(() => {
            firebase
              .firestore()
              .collection("users")
              .doc(firebase.auth().currentUser.email)
              .set({
                UserName,
                email,
                widgetOrder: 0,
                signatureColor: "white",
                fontWeight: 400,
                fontsize: 10,
                scheduleheight: 12,
                identifycode: code,
              });

            firebase
              .firestore()
              .collection("users")
              .doc(firebase.auth().currentUser.email)
              .collection("알림")
              .doc("가입 축하 알림")
              .set({
                name: UserName,
                match: "가입 축하 알림",
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              });
          })
          .then(() => {
            // 추가로 set을 수행합니다.
            return firebase
              .firestore()
              .collection("identify")
              .doc(code[0]) // code의 첫번째 문자를 사용
              .collection(code)
              .doc(firebase.auth().currentUser.email)
              .set({
                UserName,
                email,
              });
          })
          .catch((error) => {
            alert(error);
          });
      })
      .catch((error) => {
        alert(error);
      });
  };

  // 입력 칸 초기화 코드.
  const reset = () => {
    setEmail("");
    setPassword("");
    setUserName("");
    setPasswordCheck("");
    setIsCorrect("");

    setIsFocusedemail(false);
    setIsFocusedpassword(false);
    setIsFocusedname(false);
    setIsFocusedcheck(false);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={props.modalVisible}
      onRequestClose={() => {
        props.onClose();
        reset();
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
              props.onClose();
              reset();
            }}
          >
            <Icon name="arrow-back" size={25} />
          </TouchableOpacity>
        </View>

        <View style={styles.container}>
          <Text style={{ fontWeight: "300", fontSize: 23 }}>환영합니다!</Text>

          <View style={{ marginTop: 10 }}>
            <TextInput
              style={styles.input}
              placeholder="이름"
              placeholderTextColor="lightgray"
              onChangeText={(UserName) => {
                setUserName(UserName);
              }}
              autoCorrect={false}
              onFocus={() => setIsFocusedname(true)}
              onBlur={() => setIsFocusedname(false)}
            />
            {nameErrorText && (
              <Text style={styles.errorText}>{nameErrorText}</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="이메일"
              placeholderTextColor="lightgray"
              onChangeText={(email) => {
                setEmail(email);
              }}
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
              placeholder="비밀번호"
              placeholderTextColor="lightgray"
              onChangeText={(password) => {
                setPassword(password);
              }}
              autoCorrect={false}
              autoCapitalize="none"
              secureTextEntry={true}
              onFocus={() => setIsFocusedpassword(true)}
              onBlur={() => setIsFocusedpassword(false)}
            />
            {passwordErrorText && (
              <Text style={styles.errorText}>{passwordErrorText}</Text>
            )}
            <TextInput
              style={styles.input}
              placeholder="비밀번호 재입력"
              placeholderTextColor="lightgray"
              onChangeText={(passwordcheck) => {
                setPasswordCheck(passwordcheck);
              }}
              autoCorrect={false}
              autoCapitalize="none"
              secureTextEntry={true}
              onFocus={() => setIsFocusedcheck(true)}
              onBlur={() => setIsFocusedcheck(false)}
            />
            {passwordMatch === "비밀번호가 일치합니다." ? (
              <Text style={styles.correctText}>{passwordMatch}</Text>
            ) : passwordMatch === "비밀번호가 일치하지 않습니다." ? (
              <Text style={styles.errorText}>{passwordMatch}</Text>
            ) : (
              <Text style={styles.errorText}>{passwordMatch}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => registerUser(email, password, UserName)}
            style={signinButtonStyle}
            disabled={!signinButtonEnabled}
          >
            <Text style={styles.signinButtonText}>회원가입</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default Register;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginTop: 50,
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
  correctText: {
    fontSize: 15,
    color: "#2DB400",
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
