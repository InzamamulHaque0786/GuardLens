import React, { useState } from "react";
import { LuLockKeyhole, LuEyeOff, LuEye } from "react-icons/lu";
import api from "../../api/API"; 
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); 

  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const dataObject = Object.fromEntries(formData.entries());
    
    setIsLoading(true);
    setError(null); // Clear any old errors when they try again

    try {
      const response = await api.post('/auth/login', dataObject);
      setUser(response.data.user);
      navigate('/');
    } catch (err) {
      console.error("Login failed", err);
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--color-foreground) font-santoshi flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <h1 className="font-integral text-5xl font-bold tracking-tighter">
            GUARDLENS
          </h1>
        </div>

        {/* Form Container */}
        <div className="bg-(--color-background-3) border border-(--color-border) rounded-3xl p-8 md:p-10 shadow-sm">
          {/* Heading */}
          <div className="text-center mb-6">
            <p className="text-(--color-primary) font-bold font-santoshi text-2xl">
              Sign in
            </p>
          </div>

          {/* Display the error message to the user if one exists */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-(--color-primary)-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                disabled={isLoading} 
                className="w-full px-5 py-3 border border-(--color-border) bg-(--color-foreground) rounded-2xl focus:outline-none focus:border-black transition-all text-base"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-(--color-primary)-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  className="w-full px-5 py-3 border border-(--color-border) bg-(--color-foreground) rounded-2xl focus:outline-none focus:border-black transition-all text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium"
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center justify-between cursor-pointer">
              <a href="#" className="text-sm text-(--color-highlight) hover:underline">Forgot Password?</a>
            </label>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading} // Disable button while waiting for backend
              className={`w-full transition-all text-(--color-secondary) py-4 rounded-full font-medium text-lg tracking-wider mt-2 font-integral ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-(--color-primary)"
              }`}
            >
              {/*Change text to show activity */}
              {isLoading ? "LOGGING IN..." : "SIGN IN"}
            </button>

            {/* Sign Up Link */}
            <div className="text-center">
              <span className="text-gray-600 text-sm">
                Don't have an account?{" "}
              </span>
              <a
                href="#"
                className="text-sm text-(--color-highlight) hover:underline"
              >
                Create Account
              </a>
            </div>
          </form>
        </div>

        {/* Trust Signals */}
        <div className="flex justify-center gap-6 mt-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <LuLockKeyhole /> <p>Secure Login</p>
          </div>
          <div>✓ Trusted by Thousands</div>
        </div>
      </div>
    </div>
  );
};

export default Login;