import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { url } from "../slices/api";
import NotFound from "./NotFound";

const MyOrders = () => {
  const auth = useSelector((state) => state.auth);
  const [state, setState] = useState({ status: "loading", orders: [] });
  const [cancelling, setCancelling] = useState("");

  useEffect(() => {
    if (!auth.userLoaded || !auth._id) return undefined;
    let mounted = true;
    axios
      .get(`${url}/orders/my-orders`, { withCredentials: true })
      .then(({ data }) => {
        if (mounted) setState({ status: "success", orders: data.orders || [] });
      })
      .catch((error) => {
        if (mounted) {
          setState({
            status: error.response?.status === 404 ? "not-found" : "error",
            orders: [],
          });
        }
      });
    return () => {
      mounted = false;
    };
  }, [auth.userLoaded, auth._id]);

  const cancelOrder = async (order) => {
    const cancellationReason = window.prompt("Why are you cancelling this order?", "Customer requested cancellation");
    if (cancellationReason === null) return;
    setCancelling(order._id);
    try {
      await axios.post(
        `${url}/orders/${order._id}/cancel`,
        { cancellationReason },
        { withCredentials: true }
      );
      setState((current) => ({
        ...current,
        orders: current.orders.map((item) =>
          item._id === order._id ? { ...item, orderStatus: "cancelled" } : item
        ),
      }));
    } catch (error) {
      window.alert(error.response?.data?.error || "Unable to cancel this order.");
    } finally {
      setCancelling("");
    }
  };

  if (auth.userLoaded && !auth._id) {
    return <NotFound />;
  }
  if (!auth.userLoaded || state.status === "loading") {
    return <p className="page-status">Loading your orders...</p>;
  }
  if (state.status === "not-found") {
    return <NotFound />;
  }
  if (state.status === "error") {
    return <p className="page-status">Unable to load your orders.</p>;
  }
  if (state.orders.length === 0) {
    return (
      <main className="empty-page">
        <p className="eyebrow">Your account</p>
        <h1>No orders yet</h1>
        <p>When you place an order, it will appear here.</p>
        <Link to="/shop" className="primary-link">Start shopping</Link>
      </main>
    );
  }

  return (
    <main className="orders-page">
      <p className="eyebrow">Your account</p>
      <h1>My orders</h1>
      <div className="orders-list">
        {state.orders.map((order) => (
          <article className="order-card" key={order._id}>
            <div className="order-card-heading">
              <div>
                <h2>{order.orderNumber}</h2>
                <p>{new Date(order.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`order-status ${order.orderStatus}`}>
                {order.orderStatus.replace(/_/g, " ")}
              </span>
            </div>
            <div className="order-items">
              {order.items.map((item) => (
                <div className="order-item" key={`${order._id}-${item.productId}`}>
                  <span>{item.qty} × {item.name}</span>
                  <strong>R{(item.price * item.qty).toFixed(2)}</strong>
                </div>
              ))}
            </div>
            <div className="order-total">
              <span>Total</span>
              <strong>R{Number(order.totalAmount).toFixed(2)}</strong>
            </div>
            {!["collected", "cancelled"].includes(order.orderStatus) && (
              <button
                type="button"
                className="order-cancel-button"
                disabled={cancelling === order._id}
                onClick={() => cancelOrder(order)}
              >
                {cancelling === order._id ? "Cancelling..." : "Cancel order"}
              </button>
            )}
          </article>
        ))}
      </div>
    </main>
  );
};

export default MyOrders;
