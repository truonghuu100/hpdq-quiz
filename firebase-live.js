import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getDatabase, ref, set, get, onValue, serverTimestamp, update } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
const firebaseConfig={apiKey:"AIzaSyDvyzV-iQ3GtTaNJ_lpFApWwLG3ipoC7g",authDomain:"hpdq-quiz.firebaseapp.com",databaseURL:"https://hpdq-quiz-default-rtdb.asia-southeast1.firebasedatabase.app",projectId:"hpdq-quiz",storageBucket:"hpdq-quiz.firebasestorage.app",messagingSenderId:"767485831120",appId:"1:767485831:web:c28d97d45efc1ec60efbd5",measurementId:"G-N3T7TNRT64"};
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);let guestAuthPromise;
async function guestAuth(){if(auth.currentUser)return auth.currentUser;if(!guestAuthPromise)guestAuthPromise=signInAnonymously(auth).then(x=>x.user).catch(e=>{guestAuthPromise=null;throw e});return guestAuthPromise}
async function admin(){const u=auth.currentUser;if(!u||u.isAnonymous)throw Error("Vui lòng đăng nhập tài khoản Admin.");const s=await get(ref(db,"admins/"+u.uid));if(s.val()!==true)throw Error("Chưa được cấp quyền Admin. UID: "+u.uid);return u}
export const HPDQFirebase={
watchAdminAuth(cb){return onAuthStateChanged(auth,async u=>{if(!u||u.isAnonymous){cb({user:null,isAdmin:false});return}try{const s=await get(ref(db,"admins/"+u.uid));cb({user:u,isAdmin:s.val()===true,uid:u.uid})}catch(error){cb({user:u,isAdmin:false,uid:u.uid,error})}})},
async loginAdmin(username,password){if(username.trim().toLowerCase()!=="admin")throw Error("Tên đăng nhập không hợp lệ.");const c=await signInWithEmailAndPassword(auth,"admin@hpdq-quiz.local",password);const s=await get(ref(db,"admins/"+c.user.uid));return {uid:c.user.uid,isAdmin:s.val()===true}},
async logoutAdmin(){await signOut(auth)},
async createRoom(room){const u=await admin();await set(ref(db,"rooms/"+room.code),{name:room.name,ownerUid:u.uid,started:false,createdAt:serverTimestamp(),participants:{}})},
async joinRoom(code,name){const u=await guestAuth(),r=ref(db,"rooms/"+code),s=await get(r);if(!s.exists())throw Error("Mã phòng không tồn tại hoặc đã đóng");if(s.child("started").val())throw Error("Cuộc thi đã bắt đầu");if(s.child("participants").numChildren()>=300&&!s.child("participants/"+u.uid).exists())throw Error("Phòng đã đủ 300 người");await set(ref(db,"rooms/"+code+"/participants/"+u.uid),{name,joinedAt:serverTimestamp()})},
async setStarted(code,started){await admin();await update(ref(db,"rooms/"+code),{started})},
watchRoom(code,cb,err=console.error){admin().then(()=>onValue(ref(db,"rooms/"+code),s=>s.exists()?cb(s.val()):err(new Error("Phòng không còn tồn tại")),err)).catch(err)},
watchGuestRoom(code,cb,err=console.error){guestAuth().then(()=>onValue(ref(db,"rooms/"+code),s=>s.exists()?cb(s.val()):err(new Error("Phòng không còn tồn tại")),err)).catch(err)}
};