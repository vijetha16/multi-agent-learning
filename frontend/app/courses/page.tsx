"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import PortalNav from "../components/PortalNav";
import {api,getToken} from "../lib/api";
import "../portal.css";
type Course={id:number;name:string;description:string;difficulty:string;duration_minutes:number;total_levels:number;credits_required:number;category:string;enrolled:number;can_unlock:number};
export default function Courses(){
 const router=useRouter();const[courses,setCourses]=useState<Course[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 async function load(){try{if(!getToken()){router.replace("/auth");return}setCourses(await api<Course[]>("/courses"))}catch(e){setError(e instanceof Error?e.message:"Unable to load courses")}finally{setLoading(false)}}
 useEffect(()=>{load()},[]);
 async function enroll(course:Course){try{if(!course.enrolled)await api(`/courses/${course.id}/enroll`,{method:"POST"});router.push("/dashboard")}catch(e){setError(e instanceof Error?e.message:"Unable to enroll")}}
 if(loading)return <main className="portal-loading"><img src="/lumi-guide.png" alt="Lumi"/><p>Finding the best paths for you…</p></main>;
 return <main className="portal-shell"><PortalNav/><section className="portal-main"><header className="portal-head"><div><small>EXPLORE LEARNING PATHS</small><h1>Choose your next adventure.</h1><p>Paths combine focused lessons, quick checks, projects, rewards, and an industry-ready certificate.</p></div></header>{error&&<div className="dash-alert">{error}</div>}<div className="course-grid">{courses.map((course,index)=><article className="surface course-card" key={course.id}><div className="course-cover" style={{background:index%2?"linear-gradient(140deg,#0e4c5d,#2c9a91)":"linear-gradient(140deg,#271746,#754bd2)"}}><span>{index%2?"⌘":"✦"}</span><small>{course.category??"PERSONALIZED PATH"} • {course.difficulty.toUpperCase()}</small></div><div className="course-body"><h2>{course.name}</h2><p>{course.description}</p><div className="course-meta"><span>◷ {course.duration_minutes} min</span><span>⌁ {course.total_levels} levels</span><span>✦ {course.credits_required} credits</span></div><button disabled={!course.enrolled&&!course.can_unlock} onClick={()=>enroll(course)}>{course.enrolled?"Continue roadmap":course.can_unlock?"Unlock path":"Earn more credits to unlock"}</button></div></article>)}</div><article className="surface feature-strip"><img src="/lumi-guide.png" alt="Lumi"/><div><h2>PathMatch — learning paths that evolve with you</h2><p>Lumi uses your interests, completed skills, quiz mastery, and pace to reorder recommendations after every milestone.</p></div><button>Personalized automatically</button></article></section></main>
}
