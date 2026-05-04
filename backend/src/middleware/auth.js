const jwt=require("jsonwebtoken"); const prisma=require("../db");
const auth=async(req,res,next)=>{try{const h=req.headers.authorization;if(!h||!h.startsWith("Bearer "))return res.status(401).json({error:"No token"});const decoded=jwt.verify(h.split(" ")[1],process.env.JWT_SECRET);const user=await prisma.user.findUnique({where:{id:decoded.userId},select:{id:true,name:true,phone:true,role:true,isActive:true}});if(!user||!user.isActive)return res.status(401).json({error:"User not found"});req.user=user;next();}catch{return res.status(401).json({error:"Invalid token"});}};
const adminOnly=(req,res,next)=>{if(req.user?.role!=="admin")return res.status(403).json({error:"Admin required"});next();};
module.exports={auth,adminOnly};
