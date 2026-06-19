import userModel from '../models/user.model.js';
import JWT from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// --- Reusable Cookie Options ---
const cookieOptions = {
  httpOnly: true, // Prevents XSS attacks
  secure: process.env.NODE_ENV === 'production', // true in production, false on localhost
  sameSite: 'lax',
  maxAge: 10 * 24 * 60 * 60 * 1000 // 10 days in milliseconds
};

// 1. REGISTER FUNCTION
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const isUserAlreadyExists = await userModel.findOne({ email });
    if (isUserAlreadyExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role
    });

    const token = JWT.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email }, 
      process.env.JWT_SECRET,
      { expiresIn: '10d' }
    );

    res.cookie('auth_token', token, cookieOptions);

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// 2. LOGIN FUNCTION
const loginUser = async (req, res) => {
  const { email, password } = req.body; 
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = JWT.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email }, 
      process.env.JWT_SECRET,
      { expiresIn: '10d' }
    );

    res.cookie('auth_token', token, cookieOptions);

    res.status(200).json({
      message: "user logged in successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.log(err)
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

//3.LOGOUT FUNCTION
const logoutUser = async (req,res) =>{
  res.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true if on HTTPS, false if on localhost
        sameSite: 'lax', 
        path: '/' 
    });

    return res.status(200).json({ message: "Successfully logged out. Cookie destroyed." });
}

// 4. VERIFY FUNCTION
const verifyUser = async (req, res) => {

  const token = req.cookies.auth_token;
  
  if (!token) {
    return res.status(401).json({ message: "No active session found" });
  }
  
  JWT.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: "Session expired. Please log in again." });
    }
    res.status(200).json({ 
      user: {
        id: decodedUser.id,
        name: decodedUser.name,
        email: decodedUser.email,
        role: decodedUser.role
      } 
    });
  });
};

export { registerUser, loginUser,logoutUser, verifyUser };