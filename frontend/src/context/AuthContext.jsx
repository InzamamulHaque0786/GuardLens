import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // This state will hold the { name, email, role } after a successful login
  // initialize it as 'null' because no one is logged in when the app first loads
  const [user, setUser] = useState(null);

  const value = {
    user,
    setUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// a custom hook for easy access 
export function useAuth() {
  return useContext(AuthContext);
}