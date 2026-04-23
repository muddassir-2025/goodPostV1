import { createSlice } from "@reduxjs/toolkit";

const confirmSlice = createSlice({
  name: "confirm",
  initialState: {
    open: false,
    message: "",
  },
  reducers: {
    showConfirm: (state, action) => {
      state.open = true;
      state.message = action.payload;
    },
    hideConfirm: (state) => {
      state.open = false;
      state.message = "";
    },
  },
});

export const { showConfirm, hideConfirm } = confirmSlice.actions;
export default confirmSlice.reducer;