import React, { useState } from "react";
import { LuLockKeyhole, LuEyeOff, LuEye } from "react-icons/lu";
import axios from 'axios'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading,setIsLoading]=useState(false);
  const [error,setError]=useState(false);
  const [data,setData]=useState()

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target)
    const dataObject = Object.fromEntries(formData.entries())
    console.log(dataObject)

    setIsLoading(true);
    try{
         const response = await axios.post('http://localhost:3000/api/auth/login',dataObject,{ withCredentials: true })
         console.log("Login successful!", response.data);
    }catch(err){
      console.error("Login failed", err);
    }finally{
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
            <p className="text-(--color-primary) font-bold  font-santoshi text-2xl">
              Sign in
            </p>
          </div>

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
                  className="w-full px-5 py-3 border border-(--color-border) bg-(--color-foreground) rounded-2xl focus:outline-none focus:border-black transition-all text-base"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500  text-sm font-medium"
                >
                  {showPassword ? <LuEyeOff /> : <LuEye />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <label className="flex items-center  justify-between cursor-pointer">
              <div className="flex items-center gap-6">
                {/* User Radio Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="role-user"
                    name="role"
                    value="user"
                    defaultChecked // This makes 'user' the default selection on load
                    className="w-5 h-5 accent-black cursor-pointer"
                  />
                  <label
                    htmlFor="role-user"
                    className="text-sm font-medium text-(--color-primary)-700 cursor-pointer"
                  >
                    User
                  </label>
                </div>

                {/* Admin Radio Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="role-admin"
                    name="role"
                    value="admin"
                    className="w-5 h-5 accent-black cursor-pointer"
                  />
                  <label
                    htmlFor="role-admin"
                    className="text-sm font-medium text-(--color-primary)-700 cursor-pointer"
                  >
                    Admin
                  </label>
                </div>
              </div>
              <a
                href="#"
                className="text-sm  text-(--color-highlight) hover:underline"
              >
                Forgot Password?
              </a>
            </label>

            {/* Sign In Button */}
            <button
              type="submit"
              className="w-full bg-(--color-primary)  transition-all text-(--color-secondary) py-4 rounded-full font-medium text-lg tracking-wider mt-2 font-integral"
            >
              SIGN IN
            </button>
            {/* google login button
            <button
              type="button"
              onClick={() => console.log("Google Login clicked")}
              className="w-full bg-white flex items-center justify-center gap-3  border-2 border-gray-200 hover:border-gray-300 active:bg-gray-50 transition-all py-4 rounded-full font-medium text-[17px] text-gray-800"
            >
             <img className="h-6 w-6" src="src/assets/google-logo.svg" alt="" />
              <span>Sign in with Google</span>
            </button> */}

            {/* Sign Up Link */}
            <div className="text-center">
              <span className="text-gray-600 text-sm  ">
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
