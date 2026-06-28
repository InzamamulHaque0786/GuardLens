import React, { useState } from "react";
import { LuLockKeyhole, LuEyeOff, LuEye } from "react-icons/lu";
import api from "../../api/API"; 
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Link } from "react-router-dom"; // Added Link for smooth routing

const Register = () => {
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
    setError(null);

    try {
      // Pointing to the register endpoint
      const response = await api.post('/auth/register', dataObject);
      
      // Instantly log them in after a successful registration
      setUser(response.data.user);
      navigate('/');
    } catch (err) {
      console.error("Registration failed", err);
      setError(err.response?.data?.message || "Failed to create account. Please try again.");
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
              Create Account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-500 border border-red-200 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Full Name Field */}
            <div>
              <label className="block text-sm font-medium text-(--color-primary)-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                disabled={isLoading} 
                className="w-full px-5 py-3 border border-(--color-border) bg-(--color-foreground) rounded-2xl focus:outline-none focus:border-black transition-all text-base"
                placeholder="Alex Johnson"
              />
            </div>

            {/* Email Field */}
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

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-(--color-primary)-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isLoading}
                  minLength="6" // Basic frontend validation
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

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full transition-all text-(--color-secondary) py-4 rounded-full font-medium text-lg tracking-wider mt-4 font-integral ${
                isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-(--color-primary)"
              }`}
            >
              {isLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
            </button>

            {/* Sign In Link */}
            <div className="text-center mt-4">
              <span className="text-gray-600 text-sm">
                Already have an account?{" "}
              </span>
              <Link
                to="/login"
                className="text-sm text-(--color-highlight) hover:underline font-bold"
              >
                Sign In
              </Link>
            </div>
          </form>
        </div>

        {/* Trust Signals */}
        <div className="flex justify-center gap-6 mt-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <LuLockKeyhole /> <p>Secure Registration</p>
          </div>
          <div>✓ Your safety is our priority</div>
        </div>

      </div>
    </div>
  );
};

export default Register;