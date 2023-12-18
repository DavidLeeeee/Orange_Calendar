import { StyleSheet } from "react-native";
const colorThemes = {
  white: [
    "rgba(253, 253, 253, 0.9)",
    "rgba(250, 250, 250, 1)",
    "rgba(250, 250, 250, 0.9)",
    "rgba(244, 244, 244, 0.9)",
    "rgba(249, 249, 249, 1)",
    "rgba(20, 20, 20, 0.2)",
    "rgba(50, 50, 50, 1)",
    "rgba(20, 20, 20, 0.7)",
    "rgba(10, 10, 10, 0.2)",
    "rgba(250, 250, 250, 1)", //drawer
    "rgba(250, 250, 250, 1)", //background
    "rgba(250, 250, 250, 0.6)", //content
  ],
  black: [
    "rgba(0, 0, 0, 0.95)",
    "rgba(10, 10, 10, 1)",
    "rgba(15, 15, 15, 1)",
    "rgba(15, 15, 15, 1)",
    "rgba(20, 20, 20, 1)",
    "rgba(0, 0, 0, 1)",
    "rgba(230, 230, 230, 1)",
    "rgba(230, 230, 230, 1)",
    "rgba(100, 100, 100, 0.8)",
    "rgba(20, 20, 20, 1)", //drawer
    "rgba(20, 20, 20, 1)", //background
    "rgba(50, 50, 50, 1)", //content
  ],
  midnightblue: [
    "rgba(0, 0, 30, 0.95)", //header.
    "rgba(0, 0, 30, 1)", //footer
    "rgba(10, 10, 50, 1)", //topbar
    "rgba(10, 10, 50, 1)", // addbar
    "rgba(10, 10, 50, 1)", //grid.
    "rgba(0, 0, 10, 1)", //field
    "rgba(250, 250, 250, 1)", //TextColor
    "rgba(80, 80, 250, 1)", //Activated
    "rgba(250, 250, 250, 1)", //Inactivated
    "rgba(10, 10, 50, 1)", //drawer
    "rgba(10, 10, 50, 1)", //background
    "rgba(30, 50, 100, 1)", //content
  ],
  peachpuff: [
    "rgba(255, 230, 230, 0.9)",
    "rgba(255, 240, 240, 1)",
    "rgba(255, 235, 235, 0.9)",
    "rgba(255, 235, 235, 0.9)",
    "rgba(255, 240, 240, 0.8)",
    "rgba(240, 220, 220, 1)",
    "rgba(85, 5, 5, 1)",
    "rgba(195, 105, 105, 1)",
    "rgba(235, 155, 155, 0.7)",
    "rgba(255, 240, 240, 1)",
    "rgba(255, 245, 245, 1)",
    "rgba(235, 205, 205, 1)",
  ],
  orange: [
    "rgba(255, 220, 180, 0.95)", //header.
    "rgba(255, 220, 180, 1)", //footer
    "rgba(255, 220, 180, 1)", //topbar
    "rgba(255, 220, 180, 1)", // addbar
    "rgba(255, 240, 219, 1)", //field
    "rgba(255, 220, 180, 0.9)", //grid.
    "rgba(105, 30, 9, 1)", //TextColor
    "rgba(105, 30, 9, 1)", //Activated
    "rgba(175, 100, 80, 0.8)", //Inactivated
    "rgba(255, 220, 179, 1)", //drawer
    "rgba(255, 240, 219, 1)", //background
    "rgba(255, 200, 159, 0.6)", //content
  ],
  aliceblue: [
    "rgba(210, 240, 255, 0.92)", //header.
    "rgba(210, 240, 255, 1)", //footer
    "rgba(210, 240, 255, 1)", //topbar
    "rgba(210, 240, 255, 1)", // addbar
    "rgba(230, 240, 255, 1)", //field
    "rgba(200, 230, 255, 1)", //grid.
    "rgba(20, 40, 105, 0.95)", //TextColor
    "rgba(40, 80, 165, 0.95)", //Activated
    "rgba(150, 190, 255, 0.95)", //Inactivated
    "rgba(230, 240, 255, 1)", //drawer
    "rgba(230, 240, 255, 1)", //background
    "rgba(210, 230, 255, 0.9)", //content
  ],
  sienna: [
    "rgba(35, 4, 3, 0.95) ",
    "rgba(35, 5, 5, 1) ",
    "rgba(35, 5, 5, 0.95) ",
    "rgba(35, 5, 5, 0.95) ",
    "rgba(35, 5, 5, 0.95) ",
    "rgba(135, 105, 105, 0.3) ",
    "rgba(230, 180, 170, 1)", //T
    "rgba(230, 200, 190, 1) ",
    "rgba(200, 110, 100, 1) ",
    "rgba(80, 30, 20, 1) ",
    "rgba(40, 10, 10, 1) ",
    "rgba(90, 60, 60, 1) ",
  ],
  cornsilk: [
    "rgba(245, 238, 210, 0.95)", //header.
    "rgba(245, 238, 210, 1)", //footer
    "rgba(245, 238, 210, 0.95)", //topbar
    "rgba(245, 238, 210, 0.95)", // addbar
    "rgba(255, 248, 220, 1)", //field
    "rgba(255, 248, 220, 1)", //grid.
    "rgba(80, 40, 15, 0.95)", //TextColor
    "rgba(80, 40, 15, 0.8)", //Activated
    "rgba(80, 40, 15, 0.4)", //Inactivated
    "rgba(250, 243, 220, 1)", //drawer
    "rgba(245, 238, 210, 1)", //background
    "rgba(255, 248, 230, 1)", //content
  ],
  darkgreen: [
    "rgba(0, 10, 0, 0.95)", //header.
    "rgba(0, 10, 0, 1)", //footer
    "rgba(10, 20, 10, 1)", //topbar
    "rgba(10, 20, 10, 1)", // addbar
    "rgba(10, 30, 10, 1)", //grid.
    "rgba(0, 10, 0, 1)", //field
    "rgba(230, 250, 230, 1)", //TextColor
    "rgba(180, 250, 180, 0.6)", //Activated
    "rgba(250, 250, 250, 0.8)", //Inactivated
    "rgba(10, 50, 10, 1)", //drawer
    "rgba(10, 20, 10, 1)", //background
    "rgba(20, 60, 20, 0.8)", //content
  ],
};

// 기본값을 설정합니다.
let userSignatureStyles = {
  header: { backgroundColor: "rgba(2, 242, 242, 1)" },
  footer: { backgroundColor: "rgba(242, 242, 242, 1)" },
  topbar: { backgroundColor: "rgba(242, 242, 242, 1)" },
  addbar: { backgroundColor: "rgba(242, 242, 242, 1)" },
  field: { backgroundColor: "rgba(242, 242, 242, 1)" },
  grid: { backgroundColor: "rgba(242, 242, 242, 1)" },
  Textcolor: { color: "rgba(242, 242, 242, 1)" },
  Activated: "gray",
  Inactivated: "gray",
  drawer: { backgroundColor: "rgba(242, 242, 242, 1)" },
  background: { backgroundColor: "rgba(242, 242, 242, 1)" },
  content: { backgroundColor: "rgba(242, 242, 242, 1)" },
};

// signatureColor에 기반한 스타일을 가져오는 함수
const getSignatureStylesFromTheme = (theme) => {
  if (!theme || !colorThemes[theme]) {
    return userSignatureStyles; // 기본값
  }

  // 선택된 테마의 색상으로 스타일 객체를 생성
  const colors = colorThemes[theme];
  return {
    header: { backgroundColor: colors[0] },
    footer: { backgroundColor: colors[1] },
    topbar: { backgroundColor: colors[2] },
    addbar: { backgroundColor: colors[3] },
    field: { backgroundColor: colors[4] },
    grid: { borderColor: colors[5] },
    Textcolor: { color: colors[6] },
    Activated: colors[7],
    Inactivated: colors[8],
    drawer: { backgroundColor: colors[9] },
    background: { backgroundColor: colors[10] },
    content: { backgroundColor: colors[11] },
  };
};
export { getSignatureStylesFromTheme };
