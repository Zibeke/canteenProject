const configuredApiUrl = process.env.REACT_APP_API_URL;

export const url = (
  configuredApiUrl || "http://localhost:5000/api"
).replace(/\/+$/, "");

export const setHeaders = () => {
  return { withCredentials: true };
};

let refreshRequest;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const request = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isAuthRequest = /\/auth\/(admin-login|refresh|logout|google)/.test(
      request?.url || ""
    );

    if (!request || !isUnauthorized || request._retry || isAuthRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    refreshRequest =
      refreshRequest ||
      axios
        .post(`${url}/auth/refresh`, {}, { withCredentials: true })
        .finally(() => {
          refreshRequest = null;
        });

    try {
      await refreshRequest;
      return axios(request);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);