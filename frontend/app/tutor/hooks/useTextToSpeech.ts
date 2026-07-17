"use client";
import { useCallback,useEffect,useRef,useState } from "react";

export function useTextToSpeech(text:string){
  const utterance=useRef<SpeechSynthesisUtterance|null>(null);const[playing,setPlaying]=useState(false);const[paused,setPaused]=useState(false);const[rate,setRate]=useState(1);const[voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);const[voice,setVoice]=useState("");const supported=typeof window!=="undefined"&&"speechSynthesis" in window;
  useEffect(()=>{if(!supported)return;const load=()=>setVoices(window.speechSynthesis.getVoices());load();window.speechSynthesis.addEventListener("voiceschanged",load);return()=>{window.speechSynthesis.cancel();window.speechSynthesis.removeEventListener("voiceschanged",load)}},[supported]);
  const play=useCallback(()=>{if(!supported||!text)return;if(paused){window.speechSynthesis.resume();setPaused(false);setPlaying(true);return}window.speechSynthesis.cancel();const next=new SpeechSynthesisUtterance(text);next.rate=rate;next.voice=voices.find(item=>item.name===voice)??null;next.onend=()=>{setPlaying(false);setPaused(false)};next.onerror=()=>{setPlaying(false);setPaused(false)};utterance.current=next;window.speechSynthesis.speak(next);setPlaying(true)},[paused,rate,supported,text,voice,voices]);
  function pause(){if(supported&&playing){window.speechSynthesis.pause();setPaused(true);setPlaying(false)}}function stop(){if(supported)window.speechSynthesis.cancel();setPlaying(false);setPaused(false)}function restart(){stop();setTimeout(play,0)}
  return{supported,playing,paused,rate,setRate,voices,voice,setVoice,play,pause,stop,restart};
}
