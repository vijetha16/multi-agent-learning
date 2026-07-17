"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearSession, getToken } from "../lib/api";
import "./dashboard.css";

type Level = {
  id:number; level_number:number; title:string; description:string;
  credits_reward:number; status:"locked"|"unlocked"|"in_progress"|"completed";
  completion_percent:number; stars:number; estimated_minutes:number; next_lesson_id:number|null;
};
type DashboardData = {
  summary:{credits:number;streak:number;completed_lessons:number;completed_courses:number;certificates:number;leaderboard_rank:number};
  currentCourse:{id:number;name:string;progress:number;current_level:number;total_levels:number}|null;
  recentActivity:Array<{id:number;activity_type:string;description:string;created_at:string}>;
  recommendations:Array<{id:number;name:string;difficulty:string}>;
};
type User = {full_name:string;email:string;credits_balance:number;daily_streak:number};

const activityIcon:Record<string,string>={lesson_completed:"✓",roadmap_progress:"★",credits_earned:"✦",login:"↗",course_enrolled:"⌁",certificate_generated:"◇"};

export default function Dashboard() {
  const router=useRouter();
  const [dashboard,setDashboard]=useState<DashboardData|null>(null);
  const [user,setUser]=useState<User|null>(null);
  const [levels,setLevels]=useState<Level[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  const load=useCallback(async()=>{
    if(!getToken()){router.replace("/auth");return;}
    setError("");
    try{
      const me=await api<User>("/auth/me");
      let data=await api<DashboardData>("/dashboard");
      if(!data.currentCourse){
        const courses=await api<Array<{id:number;enrolled:number}>>("/courses");
        const first=courses[0];
        if(first&&!first.enrolled) await api(`/courses/${first.id}/enroll`,{method:"POST"});
        data=await api<DashboardData>("/dashboard");
      }
      const roadmap=data.currentCourse?await api<Level[]>(`/roadmap/${data.currentCourse.id}`):[];
      setUser(me);setDashboard(data);setLevels(roadmap);
    }catch(reason){
      const message=reason instanceof Error?reason.message:"Unable to load your learning path";
      setError(message);
      if(message.toLowerCase().includes("authentication")) router.replace("/auth");
    }finally{setLoading(false)}
  },[router]);

  useEffect(()=>{load()},[load]);

  function openLevel(level:Level){
    if(level.status==="locked")return;
    if(level.next_lesson_id)router.push(`/learn/${level.next_lesson_id}`);
  }

  function signOut(){clearSession();router.push("/auth")}

  if(loading)return <main className="dash-loading"><img src="/lumi-guide.png" alt="Lumi"/><div><span/><span/><span/></div><p>Lumi is preparing your learning path…</p></main>;
  if(!dashboard)return <main className="dash-error"><img src="/lumi-guide.png" alt="Lumi"/><h1>We could not open your learning path.</h1><p>{error}</p><button onClick={load}>Try again</button><Link href="/">Back home</Link></main>;

  const completed=levels.filter(level=>level.status==="completed").length;
  const active=levels.find(level=>level.status==="unlocked"||level.status==="in_progress");
  const overall=levels.length?Math.round((completed/levels.length)*100):0;
  const firstName=user?.full_name?.split(" ")[0]??"Learner";

  return <main className="dash-shell">
    <aside className="sidebar">
      <Link className="dash-brand" href="/"><span>L</span><b>Lumio</b></Link>
      <nav><Link className="selected" href="/dashboard"><i>⌂</i> Overview</Link><a href="#roadmap"><i>⌁</i> My Roadmap</a><Link href="/courses"><i>◫</i> Explore Courses</Link><Link href="/certificates"><i>◇</i> Certificates</Link><Link href="/achievements"><i>☆</i> Achievements</Link></nav>
      <div className="sidebar-bottom"><a href="#settings"><i>⚙</i> Settings</a><button className="signout" onClick={signOut}>↙ Sign out</button><div className="user-chip"><span>{firstName[0]}</span><div><b>{user?.full_name}</b><small>Level {active?.level_number??completed} learner</small></div></div></div>
    </aside>

    <section className="dash-main" id="overview">
      <header className="dash-top"><div><small>YOUR PERSONAL LEARNING SPACE</small><h1>Welcome back, {firstName} <span>👋</span></h1><p>Lumi saved your progress. Continue from exactly where you stopped.</p></div><div className="top-actions"><button aria-label="Notifications">♧<b/></button><div className="credit-pill">✦ <span>{dashboard.summary.credits??0}</span> credits</div></div></header>
      {error&&<div className="dash-alert">{error}<button onClick={()=>setError("")}>×</button></div>}
      <div className="guide-banner"><div className="guide-avatar"><img src="/lumi-guide.png" alt="Lumi, your learning guide"/></div><div><small>LUMI’S TIP</small><h2>{active?`Level ${active.level_number} is ready for you.`:"Your roadmap is complete!"}</h2><p>{active?"Finish the current lesson to unlock the next step. Locked levels stay protected until you are ready.":"Amazing work—your certificate is now within reach."}</p></div><button onClick={()=>active&&document.getElementById(`level-${active.id}`)?.scrollIntoView({behavior:"smooth",block:"center"})}>{active?"Take me there":"View certificate"} →</button></div>

      <div className="stats-grid">
        <article><span className="stat-icon violet">⌁</span><div><small>CURRENT LEVEL</small><b>Level {active?.level_number??levels.length}</b><em>{dashboard.currentCourse?.name}</em></div></article>
        <article><span className="stat-icon amber">⚡</span><div><small>LEARNING STREAK</small><b>{dashboard.summary.streak??0} days</b><em className="up">Keep it going!</em></div></article>
        <article><span className="stat-icon green">✓</span><div><small>LESSONS DONE</small><b>{dashboard.summary.completed_lessons??0}</b><em>saved permanently</em></div></article>
        <article><span className="stat-icon blue">♛</span><div><small>LEADERBOARD</small><b>#{dashboard.summary.leaderboard_rank??1}</b><em className="up">By earned credits</em></div></article>
      </div>

      <div className="dashboard-grid">
        <div className="roadmap-card" id="roadmap">
          <div className="card-head"><div><small>YOUR CURRENT PATH</small><h2>{dashboard.currentCourse?.name??"Choose a learning path"}</h2></div><div className="overall"><span>{overall}% complete</span><div><i style={{width:`${overall}%`}}/></div></div></div>
          <div className="roadmap"><div className="path-line"/>
            {levels.map((level,index)=><article id={`level-${level.id}`} className={`road-level ${level.status==="completed"?"done":level.status==="locked"?"locked":"active"} ${index%2?"right":"left"}`} key={level.id}>
              <div className="level-info"><small>LEVEL {level.level_number}</small><h3>{level.title}</h3><p>◷ {level.estimated_minutes} min <span>✦ {level.credits_reward} credits</span></p>{level.status==="in_progress"&&<div className="mini-progress"><i style={{width:`${level.completion_percent}%`}}/><b>{level.completion_percent}%</b></div>}{level.status==="locked"&&<em className="lock-note">Complete level {level.level_number-1} to unlock</em>}</div>
              <button className="level-node" disabled={level.status==="locked"||level.status==="completed"} onClick={()=>openLevel(level)} aria-label={`${level.title}: ${level.status}`}>
                {level.status==="completed"?"✓":level.status==="locked"?"🔒":level.level_number}
                {(level.status==="unlocked"||level.status==="in_progress")&&<span>PLAY</span>}
              </button>
              <div className="stars">{[1,2,3].map(star=><i className={star<=level.stars?"filled":""} key={star}>★</i>)}</div>
            </article>)}
            <div className={`certificate-goal ${overall===100?"eligible":""}`}><span>◇</span><div><small>{overall===100?"CERTIFICATE ELIGIBLE":"FINAL REWARD"}</small><b>Industry Certificate</b><p>{overall===100?"You completed the full roadmap.":"Complete every level to become eligible."}</p></div></div>
          </div>
        </div>
        <aside className="right-rail">
          <article className="continue-card"><small>CURRENT MISSION</small><span className="lesson-art"><img src="/lumi-guide.png" alt="Lumi"/></span><h3>{active?.title??"Roadmap complete"}</h3><p>{active?`Level ${active.level_number} • ${active.estimated_minutes} minutes`:"You mastered every level."}</p><div className="rail-progress"><i style={{width:`${active?.completion_percent??100}%`}}/></div><button disabled={!active} onClick={()=>active&&openLevel(active)}>{active?"Enter current lesson":"All levels complete"} <span>→</span></button></article>
          <article className="activity-card"><div className="rail-title"><h3>Recent activity</h3><button>Live history</button></div>{dashboard.recentActivity.length?dashboard.recentActivity.map(item=><div className="activity-row" key={item.id}><span>{activityIcon[item.activity_type]??"•"}</span><div><b>{item.description}</b><small>{new Date(item.created_at).toLocaleDateString()}</small></div></div>):<p className="empty-state">Complete your first lesson and your activity will appear here.</p>}</article>
          <article className="unlock-card"><span>✦</span><div><small>PERSONALIZED FOR YOU</small><b>{dashboard.recommendations[0]?.name??"More paths coming soon"}</b><p>Recommendations follow your selected interests.</p></div><button onClick={()=>router.push("/courses")}>Explore learning paths</button></article>
        </aside>
      </div>
    </section>
  </main>;
}
