import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Home from "./components/Home";
import NavBar from "./components/NavBar";
import NotFound from "./components/NotFound";
import Cart from "./components/Cart";

import "react-toastify/dist/ReactToastify.css";
import Register from "./components/auth/Register";
import Login from "./components/auth/Login";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { loadUser } from "./slices/authSlice";
import CheckoutSuccess from "./components/CheckoutSuccess";
import Shop from "./components/Shop";
import ProductDetails from "./components/ProductDetails";
import MyOrders from "./components/MyOrders";
import Account from "./components/Account";
import Dashboard from "./components/admin/Dashboard";
import Products from "./components/admin/Products";
import Users from "./components/admin/Users";
import Orders from "./components/admin/Oders";
import Summary from "./components/admin/Summary";
import CreateProduct from "./components/admin/CreateProduct";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser(null));
  }, [dispatch]);

  return (
    <div className="App">
      <BrowserRouter>
        <ToastContainer />
        <NavBar />
        <div className="content-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/shop/:slug" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/account" element={<Account />} />
            <Route path="/manage-account" element={<Account />} />
            <Route path="/checkout-success" element={<CheckoutSuccess />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Dashboard />}>
              <Route path="summary" element={<Summary />} />
              <Route path="products" element={<Products />}>
                <Route path="create-product" element={<CreateProduct />} />
              </Route>
              <Route path="users" element={<Users />} />
              <Route path="orders" element={<Orders />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
