import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logoutUser } from "../slices/authSlice";
import { toast } from "react-toastify";
import { useState } from "react";

const NavBar = () => {
  const dispatch = useDispatch();
  const { cartTotalQuantity } = useSelector((state) => state.cart);
  const auth = useSelector((state) => state.auth);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logoutUser());
    toast.warning("Logged out!", { position: "bottom-left" });
  };

  return (
    <nav className="site-nav">
      <Link to="/" className="brand">
        CANTEEN<span>.</span>
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/shop">Shop</Link>
        <Link to="/">About Us</Link>
        <Link to="/">Contact</Link>
        {auth.isAdmin && (
          <Link to="/admin/summary" className="admin-dashboard-link">
            Admin Dashboard
          </Link>
        )}
      </div>

      <div className="nav-actions">
        <Link className="nav-icon-button" to="/shop" aria-label="Search">
          <span aria-hidden="true">⌕</span>
        </Link>
        <Link to="/cart" className="cart-link">
          <span aria-hidden="true">🛒</span>
          <span className="cart-count">{cartTotalQuantity || 0}</span>
        </Link>
        {auth._id ? (
          <div className="profile-menu">
            <button
              className="profile-trigger"
              type="button"
              aria-label="Open account menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
            >
              {auth.picture ? (
                <img src={auth.picture} alt={auth.name || "Profile"} />
              ) : (
                <span>{(auth.name || "A").charAt(0).toUpperCase()}</span>
              )}
              <small>⌄</small>
            </button>
            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-summary">
                  <strong>{auth.name || "Account"}</strong>
                  <span>{auth.email}</span>
                </div>
                <Link to="/my-orders" onClick={() => setProfileOpen(false)}>
                  My orders
                </Link>
                <Link to="/account" onClick={() => setProfileOpen(false)}>
                  Manage my account
                </Link>
                <button type="button" onClick={handleLogout}>
                  Sign out
                </button>
                <div className="profile-sponsored">Sponsored by esgela</div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="account-button">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
