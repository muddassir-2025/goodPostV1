import { createSlice } from "@reduxjs/toolkit";

const confirmSlice = createSlice({
  name: "confirm",
  initialState: {
    open: false,
    message: "",
    toast: {
      open: false,
      message: "",
      type: "info",
    },
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
    showToast: (state, action) => {
      state.toast.open = true;
      state.toast.message = action.payload.message;
      state.toast.type = action.payload.type || "info";
    },
    hideToast: (state) => {
      state.toast.open = false;
      state.toast.message = "";
    },
  },
});

export const { showConfirm, hideConfirm, showToast, hideToast } = confirmSlice.actions;
export default confirmSlice.reducer;