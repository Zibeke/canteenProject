import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { url } from "./api";

const emptyUser = {
  name: "",
  email: "",
  _id: "",
  picture: "",
  employeeId: "",
  voucherBalance: 0,
  monthlyVoucherCap: 0,
  isAdmin: false,
};

const initialState = {
  ...emptyUser,
  userLoaded: false,
  loginStatus: "",
  loginError: "",
};

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${url}/auth/me`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        return null;
      }
      return rejectWithValue(error.response?.data?.error || "Unable to load user");
    }
  }
);

export const logoutUser = createAsyncThunk("auth/logoutUser", async () => {
  try {
    await axios.post(
      `${url}/auth/logout`,
      {},
      { withCredentials: true }
    );
  } catch (error) {
    console.error("Logout request failed; clearing local session:", error);
  }
});

export const adminLogin = createAsyncThunk(
  "auth/adminLogin",
  async (credentials, { rejectWithValue }) => {
    try {
      await axios.post(`${url}/auth/admin-login`, credentials, {
        withCredentials: true,
      });
      const response = await axios.get(`${url}/auth/me`, {
        withCredentials: true,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Unable to log in as admin"
      );
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadUser.pending, (state) => {
        state.userLoaded = false;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        Object.assign(state, action.payload ? {
          name: action.payload.name,
          email: action.payload.email,
          _id: action.payload._id,
          picture: action.payload.picture || "",
          employeeId: action.payload.employeeId || "",
          voucherBalance: action.payload.voucherBalance || 0,
          monthlyVoucherCap: action.payload.monthlyVoucherCap || 0,
          isAdmin: action.payload.role === "admin",
        } : emptyUser);
        state.userLoaded = true;
      })
      .addCase(loadUser.rejected, (state, action) => {
        Object.assign(state, emptyUser);
        state.userLoaded = true;
        state.loginError = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, emptyUser);
        state.userLoaded = true;
      })
      .addCase(logoutUser.rejected, (state) => {
        Object.assign(state, emptyUser);
        state.userLoaded = true;
      })
      .addCase(adminLogin.pending, (state) => {
        state.loginStatus = "pending";
        state.loginError = "";
      })
      .addCase(adminLogin.fulfilled, (state, action) => {
        Object.assign(state, {
          name: action.payload.name,
          email: action.payload.email,
          _id: action.payload._id,
          picture: action.payload.picture || "",
          employeeId: action.payload.employeeId || "",
          voucherBalance: action.payload.voucherBalance || 0,
          monthlyVoucherCap: action.payload.monthlyVoucherCap || 0,
          employeeId: action.payload.employeeId || "",
          voucherBalance: action.payload.voucherBalance || 0,
          monthlyVoucherCap: action.payload.monthlyVoucherCap || 0,
          isAdmin: action.payload.role === "admin",
          userLoaded: true,
          loginStatus: "success",
        });
      })
      .addCase(adminLogin.rejected, (state, action) => {
        state.loginStatus = "rejected";
        state.loginError = action.payload;
      });
  },
});

export default authSlice.reducer;
