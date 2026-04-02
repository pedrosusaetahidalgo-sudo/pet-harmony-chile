import{u}from"./useQuery-uUrGAd3V.js";import{a as h,v as w,s}from"./index-C7iMR5eY.js";import{u as v}from"./useMutation-DPChCHaF.js";const k=g=>{const{user:i}=h(),e=i==null?void 0:i.id,d=w(),{data:_,isLoading:l}=u({queryKey:["gamification",e],queryFn:async()=>{if(!e)return null;const{data:o,error:n}=await s.from("profiles").select("points, level, total_bookings, total_reviews, total_posts, total_adoptions, total_lost_pet_help").eq("id",e).maybeSingle();if(n)throw n;return o},enabled:!!e}),{data:m}=u({queryKey:["achievements",e],queryFn:async()=>{if(!e)return[];const{data:o,error:n}=await s.from("user_achievements").select(`
          id,
          unlocked_at,
          achievements:achievement_id (
            id,
            code,
            name,
            description,
            icon,
            points_reward,
            category
          )
        `).eq("user_id",e).order("unlocked_at",{ascending:!1});if(n)throw n;return(o||[]).map(t=>({id:t.id,code:t.achievements.code,name:t.achievements.name,description:t.achievements.description,icon:t.achievements.icon,points_reward:t.achievements.points_reward,category:t.achievements.category,unlocked_at:t.unlocked_at}))},enabled:!!e}),{data:y}=u({queryKey:["missions",e],queryFn:async()=>{if(!e)return[];const{data:o,error:n}=await s.from("missions").select("*").eq("is_active",!0).order("mission_type",{ascending:!0});if(n)throw n;const{data:t,error:c}=await s.from("user_missions").select("*").eq("user_id",e);if(c)throw c;return(o||[]).map(a=>{const r=(t||[]).find(f=>f.mission_id===a.id);return{id:a.id,code:a.code,name:a.name,description:a.description,mission_type:a.mission_type,action_type:a.action_type,target_count:a.target_count,points_reward:a.points_reward,progress:(r==null?void 0:r.progress)||0,completed:(r==null?void 0:r.completed)||!1,expires_at:(r==null?void 0:r.expires_at)||a.end_date}})},enabled:!!e}),p=v({mutationFn:async({points:o,actionType:n,actionId:t,description:c})=>{if(!(i!=null&&i.id))throw new Error("User not authenticated");const{data:a,error:r}=await s.rpc("award_points",{p_user_id:i.id,p_points:o,p_action_type:n,p_action_id:t||null,p_description:c||null});if(r)throw r;return a},onSuccess:()=>{d.invalidateQueries({queryKey:["gamification",e]}),d.invalidateQueries({queryKey:["achievements",e]}),d.invalidateQueries({queryKey:["missions",e]})}});return{stats:_,achievements:m||[],missions:y||[],isLoading:l,awardPoints:p.mutate,isAwarding:p.isPending}};export{k as useGamification};
