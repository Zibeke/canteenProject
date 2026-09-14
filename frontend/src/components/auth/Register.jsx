import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { StyledForm } from "./StyledForm";
import { url } from "../../slices/api";

const Register = () => {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    if (auth.userLoaded && auth._id) {
      navigate(auth.isAdmin ? "/admin/summary" : "/cart");
    }
  }, [auth.userLoaded, auth._id, auth.isAdmin, navigate]);

  return (
    <StyledForm>
      <h2>Register</h2>
      <p>Registration is completed securely with your Gmail account.</p>
      <a href={`${url}/auth/google?redirect=%2F`}>
        Continue with Google
      </a>
    </StyledForm>
  );
};

export default Register;
