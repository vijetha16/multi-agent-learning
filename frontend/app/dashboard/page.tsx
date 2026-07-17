"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
type NotificationItem = {id:string;kind:"reminder"|"course"|"progress";title:string;message:string;time:string;action?:string;href?:string};

const activityIcon:Record<string,string>={lesson_completed:"✓",roadmap_progress:"★",credits_earned:"✦",login:"↗",course_enrolled:"⌁",certificate_generated:"◇"};

export default function Dashboard() {
  const router=useRouter();
  const [dashboard,setDashboard]=useState<DashboardData|null>(null);
  const [user,setUser]=useState<User|null>(null);
  const [levels,setLevels]=useState<Level[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notificationsOpen,setNotificationsOpen]=useState(false);
  const [readNotifications,setReadNotifications]=useState<string[]>([]);
  const [remindersEnabled,setRemindersEnabled]=useState(true);
  const notificationRef=useRef<HTMLDivElement>(null);

  const load=useCallback(async()=>{
    if(!getToken()){router.replace("/auth");return;}
    setError("");
    try{
      const me=await api<User>("/auth/me");
      const data=await api<DashboardData>("/dashboard");
      const roadmap=data.currentCourse?await api<Level[]>(`/roadmap/${data.currentCourse.id}`):[];
      setUser(me);setDashboard(data);setLevels(roadmap);
    }catch(reason){
      const message=reason instanceof Error?reason.message:"Unable to load your learning path";
      setError(message);
      if(message.toLowerCase().includes("authentication")) router.replace("/auth");
    }finally{setLoading(false)}
  },[router]);

  useEffect(()=>{load()},[load]);
  useEffect(()=>{
    try{
      setReadNotifications(JSON.parse(localStorage.getItem("lumio_read_notifications")??"[]"));
      setRemindersEnabled(localStorage.getItem("lumio_reminders_enabled")!=="false");
    }catch{/* Keep safe defaults when device storage is unavailable. */}
  },[]);
  useEffect(()=>{
    if(!notificationsOpen)return;
    function closeOnOutsideClick(event:MouseEvent){
      if(notificationRef.current&&!notificationRef.current.contains(event.target as Node))setNotificationsOpen(false);
    }
    function closeOnEscape(event:KeyboardEvent){if(event.key==="Escape")setNotificationsOpen(false)}
    document.addEventListener("mousedown",closeOnOutsideClick);
    document.addEventListener("keydown",closeOnEscape);
    return()=>{
      document.removeEventListener("mousedown",closeOnOutsideClick);
      document.removeEventListener("keydown",closeOnEscape);
    };
  },[notificationsOpen]);

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
  const notifications:NotificationItem[]=[
    ...(active&&dashboard.currentCourse?[{id:`continue-${active.id}`,kind:"reminder" as const,title:"Your next lesson is ready",message:`Continue ${active.title} in ${dashboard.currentCourse.name}. A little progress today keeps your streak alive.`,time:"Today",action:"Continue",href:active.next_lesson_id?`/learn/${active.next_lesson_id}`:"/roadmap"}]:[]),
    {id:"new-streams",kind:"course",title:"New learning paths added",message:"Explore MBBS, MBA, BTech, BiPC, law, commerce, humanities, and competitive-exam pathways.",time:"New",action:"Explore courses",href:"/courses"},
    {id:"weekly-goal",kind:"progress",title:"Weekly learning reminder",message:remindersEnabled?"We’ll remind you to complete one module this week.":"Learning reminders are currently paused.",time:"This week"}
  ];
  const unreadCount=notifications.filter(item=>!readNotifications.includes(item.id)).length;
  function markRead(id:string){
    const next=Array.from(new Set([...readNotifications,id]));
    setReadNotifications(next);localStorage.setItem("lumio_read_notifications",JSON.stringify(next));
  }
  function markAllRead(){
    const next=notifications.map(item=>item.id);
    setReadNotifications(next);localStorage.setItem("lumio_read_notifications",JSON.stringify(next));
  }
  function toggleReminders(){
    const next=!remindersEnabled;setRemindersEnabled(next);localStorage.setItem("lumio_reminders_enabled",String(next));
  }

  return <main className="dash-shell">
    <aside className="sidebar">
      <Link className="dash-brand" href="/"><span>L</span><b>Lumio</b></Link>
      <nav><Link className="selected" href="/dashboard"><i>⌂</i> Overview</Link><Link href="/roadmap"><i>🗺</i> My Roadmap</Link><Link href="/courses"><i>◫</i> Explore Courses</Link><Link href="/presentations"><i>▣</i> PPT Creator</Link><Link href="/tutor"><i>✦</i> Ask Lumi</Link><Link href="/certificates"><i>◇</i> Certificates</Link><Link href="/achievements"><i>☆</i> Achievements</Link></nav>
      <div className="sidebar-bottom"><Link href="/profile"><i>◎</i> Edit profile</Link><button className="signout" onClick={signOut}>↙ Sign out</button><div className="user-chip"><span>{firstName[0]}</span><div><b>{user?.full_name}</b><small>Level {active?.level_number??completed} learner</small></div></div></div>
    </aside>

    <section className="dash-main" id="overview">
      <header className="dash-top"><div className="welcome-copy"><small>YOUR PERSONAL LEARNING SPACE</small><h1>Welcome back, {firstName} <span>👋</span></h1><p>Lumi saved your progress. Continue from exactly where you stopped.</p></div><div className="top-actions"><div className="notification-control" ref={notificationRef}><button type="button" className="notification-button" aria-label={`Open notifications, ${unreadCount} unread`} aria-expanded={notificationsOpen} aria-controls="notification-panel" onClick={()=>setNotificationsOpen(value=>!value)}>♧{unreadCount>0&&<b>{unreadCount>9?"9+":unreadCount}</b>}</button>{notificationsOpen&&<div className="notification-panel" id="notification-panel" role="dialog" aria-label="Notifications">
        <div className="notification-head"><div><small>LEARNING UPDATES</small><h2>Notifications</h2></div><button onClick={markAllRead} disabled={!unreadCount}>Mark all read</button></div>
        <div className="reminder-setting"><span>⏰</span><div><b>Weekly study reminders</b><small>Get a gentle nudge to maintain your progress.</small></div><button className={remindersEnabled?"on":""} role="switch" aria-checked={remindersEnabled} onClick={toggleReminders}><i/></button></div>
        <div className="notification-list">{notifications.map(item=><article className={readNotifications.includes(item.id)?"read":""} key={item.id} onClick={()=>markRead(item.id)}>
          <span className={`notification-icon ${item.kind}`}>{item.kind==="reminder"?"⌁":item.kind==="course"?"✦":"★"}</span>
          <div><div className="notification-title"><b>{item.title}</b><small>{item.time}</small></div><p>{item.message}</p>{item.href&&<Link href={item.href} onClick={()=>markRead(item.id)}>{item.action} →</Link>}</div>
          {!readNotifications.includes(item.id)&&<i className="unread-dot"/>}
        </article>)}</div>
        <div className="notification-foot">Updates are personalized from your courses and progress.</div>
      </div>}</div><button type="button" className="credit-pill" aria-label={`View credit balance: ${dashboard.summary.credits??0} credits`}>✦ <span>{dashboard.summary.credits??0}</span> credits</button></div></header>
      {error&&<div className="dash-alert">{error}<button onClick={()=>setError("")}>×</button></div>}
      <div className="stats-grid">
        <article><span className="stat-icon violet">⌁</span><div><small>CURRENT LEVEL</small><b>{levels.length?`Level ${active?.level_number??levels.length}`:"Choose a path"}</b><em>{dashboard.currentCourse?.name??"All categories available"}</em></div></article>
        <article><span className="stat-icon amber">⚡</span><div><small>LEARNING STREAK</small><b>{dashboard.summary.streak??0} days</b><em className="up">Keep it going!</em></div></article>
        <article><span className="stat-icon green">✓</span><div><small>LESSONS DONE</small><b>{dashboard.summary.completed_lessons??0}</b><em>saved permanently</em></div></article>
        <article><span className="stat-icon blue">♛</span><div><small>LEADERBOARD</small><b>#{dashboard.summary.leaderboard_rank??1}</b><em className="up">By earned credits</em></div></article>
      </div>
      <section className="stream-overview">
        <div><small>ONE PLATFORM · EVERY STREAM</small><h2>Learn beyond a single degree or career</h2><p>Build a personal path across BiPC, MBBS, MBA, BTech, commerce, law, humanities, competitive exams, programming, AI, and more.</p></div>
        <div className="stream-pills">{["BiPC","MBBS","MBA","BTech","Commerce","Law","Humanities","Exams"].map(stream=><span key={stream}>{stream}</span>)}</div>
        <div className="overview-actions"><Link href="/courses">Explore every stream →</Link><Link href="/presentations">Create a presentation →</Link></div>
      </section>

      <div className="dashboard-grid">
        <div className="roadmap-card" id="roadmap">
          <div className="card-head"><div><small>YOUR CURRENT PATH</small><h2>{dashboard.currentCourse?.name??"Choose a learning path"}</h2></div><div className="overall"><span>{overall}% complete</span><div><i style={{width:`${overall}%`}}/></div></div></div>
          <div className="roadmap"><div className="path-line"/>
            {!levels.length&&<div className="empty-roadmap"><img src="/lumi-guide.png" alt="Lumi"/><h3>Your world is ready to be created.</h3><p>Choose any course category and Lumi will open its first level.</p><button onClick={()=>router.push("/courses")}>Explore all courses →</button></div>}
            {levels.map((level,index)=><article id={`level-${level.id}`} className={`road-level ${level.status==="completed"?"done":level.status==="locked"?"locked":"active"} ${index%2?"right":"left"}`} key={level.id}>
              {(level.status==="unlocked"||level.status==="in_progress")&&<div className={`map-lumi ${index%2?"lumi-left":"lumi-right"}`}><img src="/lumi-guide.png" alt="Lumi waiting beside your active level"/><span>Let’s go!</span></div>}
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
          <article className="activity-card"><div className="rail-title"><h3>Recent activity</h3><button>Live history</button></div>{dashboard.recentActivity.length?dashboard.recentActivity.map(item=><div className="activity-row" key={item.id}><span>{activityIcon[item.activity_type]??"•"}</span><div><b>{item.description}</b><small>{new Date(item.created_at).toLocaleDateString()}</small></div></div>):<p className="empty-state">Complete your first lesson and your activity will appear here.</p>}</article>
          <article className="unlock-card"><span>✦</span><div><small>PERSONALIZED FOR YOU</small><b>{dashboard.recommendations[0]?.name??"More paths coming soon"}</b><p>Recommendations follow your selected interests.</p></div><button onClick={()=>router.push("/courses")}>Explore learning paths</button></article>
        </aside>
      </div>
    </section>
  </main>;
}
