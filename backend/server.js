import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import crypto from "node:crypto";

const app=express();
app.use(cors({origin:(process.env.ALLOWED_ORIGINS||"https://hpdq-quiz.onrender.com").split(",").map(x=>x.trim())}));
app.use(express.json({limit:"1mb"}));
let db=null;
if(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64){
 const serviceAccount=JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,"base64").toString("utf8"));
 admin.initializeApp({credential:admin.credential.cert(serviceAccount),databaseURL:process.env.FIREBASE_DATABASE_URL});
 db=admin.database();
}
function requireFirebase(_req,res,next){if(!db)return res.status(503).json({error:"Backend chờ cấu hình Firebase Service Account"});next()}

const sessions=new Map();
const ADMIN_USER=process.env.ADMIN_USERNAME||"admin";
const ADMIN_PASS=process.env.ADMIN_PASSWORD;
if(!ADMIN_PASS) throw new Error("Missing ADMIN_PASSWORD environment variable");
function token(req,res,next){
 const raw=(req.headers.authorization||"").replace(/^Bearer\s+/i,"");
 const s=sessions.get(raw);
 if(!s||s.exp<Date.now())return res.status(401).json({error:"Phiên đăng nhập hết hạn"});
 req.adminSession=s;next();
}
app.get("/health",(_req,res)=>res.json({ok:true,service:"hpdq-quiz-api"}));
app.post("/api/admin/login",(req,res)=>{
 const {username,password}=req.body||{};
 if(username!==ADMIN_USER||password!==ADMIN_PASS)return res.status(401).json({error:"Tên đăng nhập hoặc mật khẩu không đúng"});
 const token=crypto.randomBytes(32).toString("hex");
 sessions.set(token,{exp:Date.now()+8*60*60*1000});
 res.json({token,expiresIn:28800});
});
app.post("/api/admin/logout",token,(req,res)=>{for(const [k,v] of sessions)if(v===req.adminSession)sessions.delete(k);res.json({ok:true})});
app.post("/api/admin/rooms",token,requireFirebase,async(req,res)=>{
 try{
  const {code,name}=req.body||{};
  if(!/^\d{6}$/.test(String(code||""))||!String(name||"").trim())return res.status(400).json({error:"Thiếu mã phòng hoặc tên phòng"});
  const r=db.ref("rooms/"+code),snap=await r.get();
  if(snap.exists())return res.status(409).json({error:"Mã phòng đã tồn tại"});
  await r.set({name:String(name).trim().slice(0,150),started:false,createdAt:admin.database.ServerValue.TIMESTAMP,participants:{}});
  res.json({ok:true});
 }catch(e){res.status(500).json({error:"Không thể tạo phòng"})}
});
app.get("/api/rooms/:code",requireFirebase,async(req,res)=>{
 try{const code=req.params.code;if(!/^\d{6}$/.test(code))return res.status(400).json({error:"Mã phòng không hợp lệ"});const s=await db.ref("rooms/"+code).get();if(!s.exists())return res.status(404).json({error:"Không tìm thấy phòng"});const v=s.val();res.json({name:v.name,started:!!v.started,participants:Object.values(v.participants||{}).map(p=>({name:p.name,joinedAt:p.joinedAt}))})}
 catch(e){res.status(500).json({error:"Không thể đọc phòng"})}
});
app.post("/api/rooms/:code/join",requireFirebase,async(req,res)=>{
 try{const code=req.params.code,name=String(req.body?.name||"").trim();if(!/^\d{6}$/.test(code)||!name||name.length>100)return res.status(400).json({error:"Mã phòng hoặc họ tên không hợp lệ"});
 const room=db.ref("rooms/"+code),snap=await room.get();if(!snap.exists())return res.status(404).json({error:"Mã phòng không tồn tại"});
 if(snap.child("started").val())return res.status(409).json({error:"Cuộc thi đã bắt đầu"});
 const count=snap.child("participants").numChildren();if(count>=300)return res.status(409).json({error:"Phòng đã đủ 300 người"});
 const participantId=crypto.randomUUID();await room.child("participants/"+participantId).set({name,joinedAt:admin.database.ServerValue.TIMESTAMP});
 res.json({ok:true,participantId});
 }catch(e){res.status(500).json({error:"Không thể tham gia phòng"})}
});
app.post("/api/admin/rooms/:code/start",token,requireFirebase,async(req,res)=>{
 try{const r=db.ref("rooms/"+req.params.code);const s=await r.get();if(!s.exists())return res.status(404).json({error:"Không tìm thấy phòng"});await r.update({started:true});res.json({ok:true})}
 catch(e){res.status(500).json({error:"Không thể bắt đầu phòng"})}
});
const port=process.env.PORT||10000;app.listen(port,"0.0.0.0",()=>console.log("HPDQ Quiz API listening on",port));
