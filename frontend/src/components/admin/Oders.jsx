import { useEffect, useState } from "react";
import axios from "axios";
import { url } from "../../slices/api";

const statuses = ["pending", "confirmed", "processing", "ready_for_collection", "collected"];

const Orders = () => {
  const [state, setState] = useState({ status: "loading", orders: [] });
  const [updating, setUpdating] = useState("");

  const loadOrders = () => {
    setState((current) => ({ ...current, status: "loading" }));
    return axios
      .get(`${url}/admin/orders`, { withCredentials: true })
      .then(({ data }) => setState({ status: "success", orders: data.orders || [] }))
      .catch(() => setState({ status: "error", orders: [] }));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (orderId, orderStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${url}/orders/${orderId}/status`, { orderStatus }, { withCredentials: true });
      await loadOrders();
    } catch (error) {
      setState((current) => ({ ...current, status: "error" }));
    } finally {
      setUpdating("");
    }
  };

  if (state.status === "loading") return <p className="page-status">Loading orders...</p>;
  if (state.status === "error") return <p className="page-status">Unable to load orders.</p>;

  return (
    <section className="admin-orders">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Canteen administration</p>
          <h1>Orders</h1>
        </div>
        <span className="admin-order-count">{state.orders.length} recent orders</span>
      </div>
      {state.orders.length === 0 ? (
        <p className="admin-empty">No orders have been placed yet.</p>
      ) : (
        <div className="admin-order-list">
          {state.orders.map((order) => (
            <article className="admin-order-card" key={order._id}>
              <div>
                <p className="eyebrow">{order.referenceNumber}</p>
                <h2>{order.orderNumber}</h2>
                <p>{order.userId?.email || "Customer"} · {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="admin-order-items">
                {order.items.map((item) => <span key={`${order._id}-${item.productId}`}>{item.qty} × {item.name}</span>)}
              </div>
              <strong>R{Number(order.totalAmount).toFixed(2)}</strong>
              <select
                value={order.orderStatus}
                disabled={updating === order._id}
                onChange={(event) => updateStatus(order._id, event.target.value)}
              >
                {statuses.map((status) => <option value={status} key={status}>{status.replace(/_/g, " ")}</option>)}
              </select>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Orders;
