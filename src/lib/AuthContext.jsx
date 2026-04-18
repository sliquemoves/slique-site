// AuthContext removed — authentication was base44-specific.
// Admin is now protected by a simple password gate in Admin.jsx.
import { createContext, useContext } from 'react';
const AuthContext = createContext({});
export const AuthProvider = ({ children }) => children;
export const useAuth = () => useContext(AuthContext);
