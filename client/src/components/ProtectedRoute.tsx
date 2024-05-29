import { Navigate, Outlet } from "react-router-dom";
import { ALL_ROUTES } from "../shared/routes";

export const ProtectedRoute = () => {
  const user = localStorage.getItem("authToken")
    ? localStorage.getItem("authToken")
    : null;
  
  if (!user) {
    return <Navigate to={ALL_ROUTES.LOGIN} />;
  }
  return <Outlet></Outlet>;
};
