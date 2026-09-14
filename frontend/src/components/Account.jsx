import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Account = () => {
  const auth = useSelector((state) => state.auth);

  if (!auth.userLoaded) {
    return <p className="page-status">Loading your account...</p>;
  }
  if (!auth._id) {
    return (
      <main className="empty-page">
        <h1>Manage your account</h1>
        <p>Sign in to view your account details.</p>
        <Link to="/login" className="primary-link">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="account-page">
      <p className="eyebrow">Your account</p>
      <h1>Manage your account</h1>
      <div className="account-grid">
        <section className="account-card account-profile">
          <div className="account-avatar">
            {auth.picture ? <img src={auth.picture} alt="" /> : (auth.name || "A").charAt(0)}
          </div>
          <div>
            <h2>{auth.name}</h2>
            <p>{auth.email}</p>
            {auth.employeeId && <p>Employee ID: {auth.employeeId}</p>}
          </div>
        </section>
        <section className="account-card">
          <h2>Voucher balance</h2>
          <p className="account-balance">R{auth.voucherBalance || 0}</p>
          <p>Monthly allowance: R{auth.monthlyVoucherCap || 0}</p>
        </section>
      </div>
      <div className="account-actions">
        <Link to="/my-orders">View my orders</Link>
        <Link to="/shop">Continue shopping</Link>
      </div>
    </main>
  );
};

export default Account;
