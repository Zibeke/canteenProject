import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { StyledForm } from "./StyledForm";
import { adminLogin } from "../../slices/authSlice";
import { url } from "../../slices/api";
import { useState } from "react";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const [adminMode, setAdminMode] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });

  useEffect(() => {
    if (auth.userLoaded && auth._id) {
      navigate(auth.isAdmin ? "/admin/summary" : "/cart");
    }
  }, [auth.userLoaded, auth._id, auth.isAdmin, navigate]);

  const handleAdminSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(adminLogin(credentials));
    if (adminLogin.fulfilled.match(result)) {
      navigate("/admin/summary");
    }
  };

  return (
    <StyledForm onSubmit={adminMode ? handleAdminSubmit : (event) => event.preventDefault()}>
      <h2>Login</h2>
      {adminMode ? (
        <>
          <input
            type="text"
            placeholder="Username"
            value={credentials.username}
            onChange={(event) =>
              setCredentials({ ...credentials, username: event.target.value })
            }
          />
          <input
            type="password"
            placeholder="Password"
            value={credentials.password}
            onChange={(event) =>
              setCredentials({ ...credentials, password: event.target.value })
            }
          />
          <button type="submit">
            {auth.loginStatus === "pending" ? "Signing in..." : "Admin login"}
          </button>
          {auth.loginStatus === "rejected" && <p>{auth.loginError}</p>}
          <button type="button" onClick={() => setAdminMode(false)}>
            Use Gmail login
          </button>
        </>
      ) : (
        <>
          <p>Sign in with your Gmail account to continue.</p>
          <a href={`${url}/auth/google?redirect=%2F`}>
            Continue with Google
          </a>
          <p>
            <button type="button" onClick={() => setAdminMode(true)}>
              Admin login
            </button>
          </p>
        </>
      )}
    </StyledForm>
  );
};

export default Login;

