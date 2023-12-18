import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { firebase } from "../../../../../Afirebaseconfig";

//0930 권한 설정, 코드 수정 필요. 효율성 고려해서 수정 필요.

export default function Power1(props) {
  const [authMemo, setAuthMemo] = useState(null);
  const [authAdmin, setAuthAdmin] = useState(null);
  const [authRepeat, setAuthRepeat] = useState(null);
  const [authSchedule, setAuthSchedule] = useState(null);
  const [authAlarm, setAuthAlarm] = useState(null);
  const [authTodo, setAuthTodo] = useState(null);
  const [authWidget, setAuthWidget] = useState(null);

  const db = firebase.firestore();

  //데이터를 받으면 props가 아닌 route.props에 데이터가 담긴다.
  //임의로 props라고 이름 지었다.
  // console.log(props.selectedGroup);
  // console.log(props.power);

  useEffect(() => {
    // 상태값이 null인 경우에만 데이터를 가져옴
    if (
      authMemo === null &&
      authAdmin === null &&
      authRepeat === null &&
      authSchedule === null &&
      authAlarm === null &&
      authTodo === null &&
      authWidget === null
    ) {
      getAuthoritypower(props.power);
    }
  }, [props.selectedGroup]);

  //메모권한 토글.
  const toggleMemo = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Memo: !authMemo, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  //그룹원관리권한 토글.
  const toggleAdmin = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Admin: !authAdmin, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  //일정관리권한 토글.
  const toggleSchedule = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Schedule: !authSchedule, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  //반복일정관리권한 토글.
  const toggleRepeat = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Repeat: !authRepeat, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  //대기자관리권한 토글.
  const toggleAlarm = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Alarm: !authAlarm, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  const toggleTodo = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Todo: !authTodo, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  const toggleWidget = () => {
    db.collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power)
      .update({
        Widget: !authWidget, // 권한 정보 업데이트
      })
      .then(() => {
        console.log("권한 정보가 업데이트되었습니다.");
      })
      .catch((error) => {
        console.error("권한 정보 업데이트 중 오류 발생:", error);
      });
  };

  //권한들 불러오기.
  const getAuthoritypower = () => {
    const docRef = db
      .collection("Group calendar")
      .doc(props.selectedGroup)
      .collection("권한")
      .doc(props.power);

    docRef.onSnapshot((snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data();
        const { Memo, Admin, Repeat, Schedule, Alarm, Todo, Widget } = data; // 데이터를 한 번에 변수에 담음
        setAuthMemo(Memo);
        setAuthAdmin(Admin);
        setAuthRepeat(Repeat);
        setAuthSchedule(Schedule);
        setAuthAlarm(Alarm);
        setAuthTodo(Todo);
        setAuthWidget(Widget);
      } else {
        // 문서가 삭제되었거나 존재하지 않는 경우
        console.log("문서가 존재하지 않음");
        // 상태를 초기화하거나 필요한 처리를 추가할 수 있습니다.
      }
    });
  };

  return (
    <View style={styles.container}>
      <View style={{ padding: 4 }}></View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          메모 작성
        </Text>
        <Switch
          value={authMemo}
          onValueChange={toggleMemo}
          style={{ height: 24 }}
        />
      </View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          일정 등록
        </Text>
        <Switch
          value={authSchedule}
          onValueChange={toggleSchedule}
          style={{ height: 24 }}
        />
      </View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          반복 일자
        </Text>
        <Switch
          value={authRepeat}
          onValueChange={toggleRepeat}
          style={{ height: 24 }}
        />
      </View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          알림 요청
        </Text>
        <Switch
          value={authAlarm}
          onValueChange={toggleAlarm}
          style={{ height: 24 }}
        />
      </View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          그룹 관리
        </Text>
        <Switch
          value={authAdmin}
          onValueChange={toggleAdmin}
          style={{ height: 24 }}
        />
      </View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          투두 등록
        </Text>
        <Switch
          value={authTodo}
          onValueChange={toggleTodo}
          style={{ height: 24 }}
        />
      </View>

      <View style={styles.toggleButton}>
        <Text style={{ color: "rgba(10,10,10,1)", fontSize: 15 }}>
          위젯 등록
        </Text>
        <Switch
          value={authWidget}
          onValueChange={toggleWidget}
          style={{ height: 24 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.95)",
    padding: 10,
    borderWidth: 1,
    borderRadius: 5,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  toggleButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
});
