const configuredApiUrl = process.env.REACT_APP_API_URL;

export const url = (
  configuredApiUrl || "http://localhost:5000/api"
).replace(/\/+$/, "");

export const setHeaders = () => {
  return { withCredentials: true };
};