import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, getToken, setToken } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [shop, setShop] = useState(null);
  const [ready, setReady] = useState(!getToken());

  const applySession = useCallback(({ token, user, shop }) => {
    if (token) setToken(token);
    setUser(user);
    setShop(shop || null);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    api("/auth/me")
      .then(applySession)
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, [applySession]);

  const login = async (login, password) => {
    const session = await api("/auth/login", { method: "POST", body: { login, password } });
    applySession(session);
    return session.user;
  };

  const register = async (values) => {
    const session = await api("/auth/register", { method: "POST", body: values });
    applySession(session);
    return session.user;
  };

  // Tải lại user + shop (VD: sau khi admin duyệt yêu cầu đối tác thì role đổi thành Seller)
  const refresh = useCallback(async () => {
    if (getToken()) applySession(await api("/auth/me"));
  }, [applySession]);

  const logout = () => {
    setToken(null);
    setUser(null);
    setShop(null);
  };

  return (
    <AuthContext.Provider value={{ user, shop, ready, login, register, logout, refresh, setUser, setShop }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
