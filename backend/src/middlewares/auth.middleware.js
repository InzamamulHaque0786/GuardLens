import JWT from 'jsonwebtoken'

export const verifyJWT = (req,res,next)=>{
    const token = req.cookies.auth_token;

    if(!token){
        return res.status(401).json({
            message:"Access denied , no token provided or invalid format"
        })
    }

    JWT.verify(token,process.env.JWT_SECRET,(err,decodedUser)=>{
        if(err){
            return res.status(403).json({success:false,message:"Invalid token"})
        }
        req.user=decodedUser
        next()
    })
}
export const roleAuthorization = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Forbidden. You do not have permission to perform this action." 
            });
        }
        next(); 
    };
};