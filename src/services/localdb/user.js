// BACKEND: restore this later — retrieves JWT token from localStorage for axios interceptors
// export const getUserToken = () => {
//   const authToken = localStorage.getItem("authToken");
//   const token = JSON.parse(authToken)?.replace(/"/g, "");
//   return token;
// };

export const getUserToken = () => null;
