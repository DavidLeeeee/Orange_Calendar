// signatureColorSlice.js
// signatureColorSlice.js
import { createSlice } from "@reduxjs/toolkit";

export const signatureColorSlice = createSlice({
  name: "signatureColor",
  initialState: "none", // 예시 초기 상태
  reducers: {
    // 액션 생성자를 정의합니다.
    updateSignatureColor: (state, action) => {
      return action.payload;
    },
  },
});

// 액션 생성자를 내보냅니다.
export const { updateSignatureColor } = signatureColorSlice.actions;

export default signatureColorSlice.reducer;
