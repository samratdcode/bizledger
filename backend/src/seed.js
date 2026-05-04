require("dotenv").config(); const {PrismaClient}=require("@prisma/client"); const bcrypt=require("bcryptjs"); const prisma=new PrismaClient();
async function seed(){
  console.log("🌱 Seeding...");
  const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD||"changeme123",12);
  const admin=await prisma.user.upsert({where:{phone:process.env.ADMIN_PHONE||"9999999999"},update:{},create:{name:process.env.ADMIN_NAME||"Admin",phone:process.env.ADMIN_PHONE||"9999999999",passwordHash:hash,role:"admin"}});
  console.log("✅ Admin:",admin.name,admin.phone);
  const poolCount=await prisma.sharedCashPool.count();
  if(poolCount===0){await prisma.sharedCashPool.create({data:{balance:0}});console.log("✅ Cash pool created");}
  for(const b of [{name:"Nursing Home",type:"nursing_home",icon:"🏥",color:"#3B82F6",sortOrder:0},{name:"Diagnostic Centre",type:"diagnostic",icon:"🔬",color:"#8B5CF6",sortOrder:1},{name:"Pharmacy",type:"pharmacy",icon:"💊",color:"#10B981",sortOrder:2}]){
    const ex=await prisma.business.findFirst({where:{type:b.type}});
    if(!ex){await prisma.business.create({data:b});console.log("✅ Business:",b.name);}
  }
  for(const p of [{name:"Chanchal Haldar",initials:"CH",note:null,sortOrder:0},{name:"Monidipa Haldar",initials:"MH",note:"Debalamal TS",sortOrder:1},{name:"Suchismita Haldar",initials:"SH",note:null,sortOrder:2},{name:"Susmita Haldar",initials:"SH",note:null,sortOrder:3},{name:"Shubham Roy",initials:"SR",note:null,sortOrder:4},{name:"Samrat Dutta",initials:"SD",note:null,sortOrder:5}]){
    const ex=await prisma.partner.findFirst({where:{name:p.name}});
    if(!ex){await prisma.partner.create({data:p});console.log("✅ Partner:",p.name);}
  }
  console.log("\n🎉 Done! Login →",process.env.ADMIN_PHONE||"9999999999","/",process.env.ADMIN_PASSWORD||"changeme123");
}
seed().catch(e=>{console.error(e);process.exit(1);}).finally(()=>prisma.$disconnect());
