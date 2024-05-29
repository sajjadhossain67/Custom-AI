export const getUserToken = () => {
    // retrieving jwt token
    const authToken = localStorage.getItem("authToken");
    const token = JSON.parse(authToken)?.replace(/"/g, "");
    return token;
};
