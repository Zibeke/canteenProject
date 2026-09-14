import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  addToCart,
  clearCart,
  decreaseCart,
  getTotals,
  removeFromCart,
} from "../slices/cartSlice";
import PayButton from "./PayButton";
import { url } from "../slices/api";

const productImageUrl = (image) =>
  image?.startsWith("http")
    ? image
    : `${url.replace("/api", "")}/${String(image || "").replace(/^\/+/, "")}`;

const Cart = () => {
  const cart = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getTotals());
  }, [cart.cartItems, dispatch]);

  if (cart.cartItems.length === 0) {
    return (
      <main className="cart-container">
        <div className="cart-empty">
          <h1>Your <span>Cart</span></h1>
          <p>Your cart is currently empty.</p>
          <Link to="/shop">Continue Shopping</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-container">
      <div className="cart-layout">
        <section className="cart-products">
          <div className="cart-heading">
            <h1>Your <span>Cart</span></h1>
            <p>{cart.cartTotalQuantity} Items</p>
          </div>
          <div className="cart-table">
            <div className="cart-table-head">
              <span>Product Details</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Subtotal</span>
            </div>
            {cart.cartItems.map((cartItem) => {
              const price = cartItem.isSpecial && cartItem.specialPrice
                ? cartItem.specialPrice
                : cartItem.price;
              return (
                <div className="cart-item" key={cartItem._id}>
                  <div className="cart-product">
                    <div className="cart-product-image">
                      <img src={productImageUrl(cartItem.images?.[0])} alt={cartItem.name} />
                    </div>
                    <div className="cart-product-copy">
                      <h3>{cartItem.name}</h3>
                      <button type="button" onClick={() => dispatch(removeFromCart(cartItem))}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="cart-product-price">R{Number(price).toFixed(2)}</div>
                  <div className="cart-product-quantity">
                    <button type="button" onClick={() => dispatch(decreaseCart(cartItem))}>-</button>
                    <span className="count">{cartItem.cartQuantity}</span>
                    <button type="button" onClick={() => dispatch(addToCart(cartItem))}>+</button>
                  </div>
                  <div className="cart-product-total-price">
                    R{(Number(price) * cartItem.cartQuantity).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-actions">
            <button className="clear-btn" type="button" onClick={() => dispatch(clearCart())}>
              Clear Cart
            </button>
            <Link to="/shop">Continue Shopping</Link>
          </div>
        </section>
        <aside className="cart-checkout">
          <h2>Order Summary</h2>
          <div className="subtotal">
            <span>Subtotal</span>
            <strong>R{Number(cart.cartTotalAmount).toFixed(2)}</strong>
          </div>
          <p className="checkout-note">Taxes and collection details are calculated at checkout.</p>
          {auth._id ? (
            <PayButton cartItems={cart.cartItems} />
          ) : (
            <button className="cart-login" type="button" onClick={() => navigate("/login")}>
              Login to Check out
            </button>
          )}
        </aside>
      </div>
    </main>
  );
};

export default Cart;
