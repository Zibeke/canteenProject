import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { url, setHeaders } from "./api";
import { toast } from "react-toastify";

const initialState = {
  items: [],
  status: null,
  createStatus: null,
};

export const productsFetch = createAsyncThunk(
  "products/productsFetch",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${url}/products`, {
        params: {
          ...(params.search ? { search: params.search } : {}),
          ...(params.category && params.category !== "All"
            ? { category: params.category }
            : {}),
          ...(params.page ? { page: params.page } : {}),
          ...(params.limit ? { limit: params.limit } : {}),
        },
      });

      return response.data;
    } catch (error) {
      console.log(error);
      return rejectWithValue(
        error.response?.data?.error || "Unable to load products"
      );
    }
  }
);

export const productsCreate = createAsyncThunk(
  "products/productsCreate",
  async (values, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${url}/products`,
        values,
        setHeaders()
      );

      return response.data;
    } catch (error) {
      console.log(error);
      const message = error.response?.data?.error || "Unable to create product";
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: {
    [productsFetch.pending]: (state, action) => {
      state.status = "pending";
    },
    [productsFetch.fulfilled]: (state, action) => {
      const products = action.payload?.products;
      state.items = Array.isArray(products)
        ? products.filter((product) => product && product._id)
        : [];
      state.status = "success";
    },
    [productsFetch.rejected]: (state, action) => {
      state.status = "rejected";
    },
    [productsCreate.pending]: (state, action) => {
      state.createStatus = "pending";
    },
    [productsCreate.fulfilled]: (state, action) => {
      if (action.payload?._id) {
        state.items.push(action.payload);
      }
      state.createStatus = "success";
      toast.success("Product Created!");
    },
    [productsCreate.rejected]: (state, action) => {
      state.createStatus = "rejected";
    },
  },
});

export default productsSlice.reducer;
