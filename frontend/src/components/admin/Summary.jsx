import { useEffect, useState } from "react";
import axios from "axios";
import { url } from "../../slices/api";

const Summary = () => {
  const [state, setState] = useState({ status: "loading", stats: null });

  useEffect(() => {
    let mounted = true;
    axios
      .get(`${url}/admin/dashboard/stats`, { withCredentials: true })
      .then(({ data }) => {
        if (mounted) setState({ status: "success", stats: data });
      })
      .catch(() => {
        if (mounted) setState({ status: "error", stats: null });
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (state.status === "loading") return <p className="page-status">Loading summary...</p>;
  if (state.status === "error") return <p className="page-status">Unable to load the dashboard summary.</p>;

  const { stats } = state;
  const cards = [
    ["Today's revenue", `R${Number(stats.todayRevenue || 0).toFixed(2)}`],
    ["Today's orders", stats.todayOrders || 0],
    ["Open orders", stats.openOrdersCount || 0],
    ["Pending penalties", stats.pendingPenalties || 0],
  ];

  return (
    <section className="admin-summary">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Canteen administration</p>
          <h1>Summary</h1>
        </div>
        <span className="admin-closing-time">Closing time: {stats.closingTime}</span>
      </div>
      <div className="admin-summary-grid">
        {cards.map(([label, value]) => (
          <article className="admin-summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
    </section>
  );
};

export default Summary;
