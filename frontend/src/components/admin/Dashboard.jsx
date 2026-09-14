import styled from "styled-components";
import { Outlet, NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const Dashboard = () => {
  const auth = useSelector((state) => state.auth);

  if (!auth.userLoaded) return <p>Loading...</p>;
  if (!auth.isAdmin) return <Navigate to="/login" replace />;

  return (
    <StyledDashboard>
      <SideNav>
      <div className="admin-brand">Canteen <span>Admin</span></div>
      <h3>Quick links</h3>
        <NavLink
          className={({ isActive }) =>
            isActive ? "link-active" : "link-inactive"
          }
          to="/admin/summary"
        >
          Summary
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "link-active" : "link-inactive"
          }
          to="/admin/products"
        >
          Products
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "link-active" : "link-inactive"
          }
          to="/admin/orders"
        >
          Orders
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive ? "link-active" : "link-inactive"
          }
          to="/admin/users"
        >
          Users
        </NavLink>
      </SideNav>
      <Content>
        <Outlet />
      </Content>
    </StyledDashboard>
  );
};

export default Dashboard;

const StyledDashboard = styled.div`
  display: flex;
  min-height: calc(100vh - 72px);
  background: #f8fafc;
`;

const SideNav = styled.div`
  border-right: 1px solid gray;
  height: calc(100vh - 72px);
  position: fixed;
  overflow-y: auto;
  width: 200px;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background: #fff;
  border-color: #f1f5f9;

  h3 {
    margin: 0 0 1rem 0;
    padding: 0;
    text-transform: uppercase;
    font-size: 17px;
    color: #9ca3af;
  }

  a {
    text-decoration: none;
    margin-bottom: 1rem;
    font-size: 14px;
    color: #6b7280;
    padding: 10px 12px;
    border-radius: 5px;
  }

  .link-active {
    color: #ea580c;
    background: #fff7ed;
    font-weight: 600;
  }

  .admin-brand {
    color: #1f2937;
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 2rem;

    span {
      color: #ea580c;
      font-size: 12px;
      margin-left: 4px;
      text-transform: uppercase;
    }
  }
`;

const Content = styled.div`
  margin-left: 200px;
  padding: 2rem 3rem;
  width: 100%;
`;
