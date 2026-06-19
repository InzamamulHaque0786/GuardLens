import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/API'; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const checkLoggedInUser = async () => {
      try {
        const response = await api.get('/auth/verify');//check if the user has valid cookies
        setUser(response.data.user);
      } catch (error) {
        // If no cookie or expired, ensure state is clean
        console.log("No valid session found.");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoggedInUser();
  }, []); 

  // This prevents the Guards from prematurely kicking the user out.
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-600 animate-pulse">
          Verifying session...
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}