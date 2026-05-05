<<<<<<<< HEAD:docs/assets/useAdminAudit-EUrm6yWq.js
import{u as e,s as n}from"./index-i7ChkfIQ.js";function d(){const{user:t}=e();return{logAction:async(i,a,s,r)=>{if(t)try{await n.from("admin_audit_log").insert({admin_user_id:t.id,action:i,target_type:a,target_id:s,details:r??{}})}catch{}}}}export{d as u};
========
import{u as e,s as n}from"./index-CztV0_za.js";function d(){const{user:t}=e();return{logAction:async(i,a,s,r)=>{if(t)try{await n.from("admin_audit_log").insert({admin_user_id:t.id,action:i,target_type:a,target_id:s,details:r??{}})}catch{}}}}export{d as u};
>>>>>>>> 4dbc5168 (fix(build): rebuild docs/ con env vars VITE_SUPABASE_* — app en blanco):docs/assets/useAdminAudit-BtwIINBa.js
