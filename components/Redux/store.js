// store.js
import { configureStore } from "@reduxjs/toolkit";
import signatureColorReducer from "./signatureColorSlice";

// 스토어 구성
export const store = configureStore({
  reducer: {
    signatureColor: signatureColorReducer, // 슬라이스 리듀서 등록
  },
});
