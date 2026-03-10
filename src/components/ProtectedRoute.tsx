// BACKEND: restore this later — protected route that checks JWT auth token
// import { Navigate, Outlet } from "react-router-dom";
// import { ALL_ROUTES } from "../shared/routes";
//
// export const ProtectedRoute = () => {
//   const user = localStorage.getItem("authToken")
//     ? localStorage.getItem("authToken")
//     : null;
//   if (!user) {
//     return <Navigate to={ALL_ROUTES.LOGIN} />;
//   }
//   return <Outlet></Outlet>;
// };

// Stub export so any lingering imports don't break the build
export const ProtectedRoute = () => null;
