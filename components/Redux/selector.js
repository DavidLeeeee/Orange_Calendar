// selectors.js
import { createSelector } from "reselect";
import { getSignatureStylesFromTheme } from "../Tab_Home/SignatureColor";

// createSelector를 사용하여 메모이제이션된 셀렉터를 생성합니다.
export const selectSignatureStyles = createSelector(
  [(state) => state.signatureColor], // 의존하는 부분의 상태를 배열로 전달합니다.
  (signatureColor) => {
    // 의존하는 상태가 바뀔 때만 이 함수가 실행됩니다.
    const themeStyles = getSignatureStylesFromTheme(signatureColor);

    // 계산된 스타일 객체를 반환합니다.
    return {
      header: themeStyles.header,
      footer: themeStyles.footer,
      topbar: themeStyles.topbar,
      addbar: themeStyles.addbar,
      field: themeStyles.field,
      grid: themeStyles.grid,
      Textcolor: themeStyles.Textcolor,
      Activated: themeStyles.Activated,
      Inactivated: themeStyles.Inactivated,
      drawer: themeStyles.drawer,
      background: themeStyles.background,
      content: themeStyles.content,
    };
  }
);
