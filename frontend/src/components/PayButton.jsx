import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { url } from "../slices/api";

const PayButton = ({ cartItems }) => {
  const navigate = useNavigate();
  const [method, setMethod] = useState("pay_by_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: order } = await axios.post(
        `${url}/orders`,
        {
          paymentMethod: method,
          items: cartItems.map(({ _id, cartQuantity }) => ({
            productId: _id,
            qty: cartQuantity,
          })),
        },
        { withCredentials: true }
      );

      if (method === "pay_by_card") {
        const { data } = await axios.post(
          `${url}/payments/checkout-session`,
          { orderId: order._id },
          { withCredentials: true }
        );
        window.location.href = data.url;
        return;
      }

      navigate("/checkout-success");
    } catch (checkoutError) {
      setError(
        checkoutError.response?.data?.error || "Unable to create your order"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <fieldset className="payment-methods">
        <legend>Payment method</legend>
        <label>
          <input type="radio" name="paymentMethod" checked={method === "pay_by_card"} onChange={() => setMethod("pay_by_card")} />
          Card
        </label>
        <label>
          <input type="radio" name="paymentMethod" checked={method === "cash_at_till"} onChange={() => setMethod("cash_at_till")} />
          Cash at till
        </label>
        <label>
          <input type="radio" name="paymentMethod" checked={method === "pay_by_voucher"} onChange={() => setMethod("pay_by_voucher")} />
          Voucher
        </label>
      </fieldset>
      {error && <p className="checkout-error">{error}</p>}
      <button className="checkout-button" type="button" disabled={loading} onClick={handleCheckout}>
        {loading ? "Processing..." : "Place Order"}
      </button>
    </>
  );
};

export default PayButton;
