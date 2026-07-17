"use client";
import { useState } from "react";
import type { TutorAnswer,VisualType } from "../types";

type RendererKind="geometry"|"chart"|"timeline"|"code"|"concept";
export const visualRegistry:Record<VisualType,RendererKind>={"geometry":"geometry","function-graph":"chart","statistical-chart":"chart","financial-chart":"chart","timeline":"timeline","code-flow":"code","equation":"concept","process":"concept","flowchart":"concept","concept-map":"concept","comparison":"concept","labelled-diagram":"concept","cycle":"concept","memory":"concept","data-structure":"concept","algorithm":"concept","network":"concept","architecture":"concept","simulation":"concept","animated-steps":"concept"};

export default function VisualRenderer({visual}:Readonly<{visual:NonNullable<TutorAnswer["visual"]>}>){
  const[step,setStep]=useState(0);const config=visual.config;const steps=visual.steps.length?visual.steps:(config.nodes??[]).map(node=>({title:node.label,description:node.group??"",narration:null}));const renderer=visualRegistry[visual.type]??"concept";
  if(renderer==="geometry"&&config.radius){const radius=Math.max(1,Math.min(config.radius,20));return <div className="geometry-visual" role="img" aria-label={visual.altText}><div className="circle-shape" style={{width:`${80+radius*5}px`,height:`${80+radius*5}px`}}><i/><span>r = {radius}</span></div><b>Area ≈ {(Math.PI*radius*radius).toFixed(2)}</b></div>}
  if(renderer==="chart"&&config.values?.length)return <div className="bar-visual" role="img" aria-label={visual.altText}>{config.values.map((value,index)=><div key={`${value}-${index}`}><i style={{height:`${Math.max(12,Math.min(100,Math.abs(value)))}%`}}/><span>{config.labels?.[index]??index+1}</span></div>)}</div>;
  if(renderer==="timeline"&&config.events?.length)return <div className="timeline-visual" aria-label={visual.altText}>{config.events.map(event=><article key={`${event.label}-${event.title}`}><b>{event.label}</b><div><h4>{event.title}</h4><p>{event.description}</p></div></article>)}</div>;
  if(renderer==="code"&&config.code)return <div className="code-visual"><pre>{config.code}</pre>{steps[step]&&<p><b>{steps[step].title}</b>{steps[step].description}</p>}<StepControls step={step} count={steps.length} setStep={setStep}/></div>;
  return <div className="concept-visual" role="img" aria-label={visual.altText}><div className="concept-center">{visual.title}</div><div>{(config.nodes??steps.map((item,index)=>({id:String(index),label:item.title,group:null}))).map(node=><span key={node.id}>{node.label}</span>)}</div>{steps.length>0&&<><p><b>{steps[step].title}</b>{steps[step].description}</p><StepControls step={step} count={steps.length} setStep={setStep}/></>}</div>;
}
function StepControls({step,count,setStep}:{step:number;count:number;setStep:(value:number)=>void}){return <div className="step-controls"><button disabled={step===0} onClick={()=>setStep(step-1)}>← Previous</button><span>{step+1} / {count}</span><button disabled={step>=count-1} onClick={()=>setStep(step+1)}>Next →</button></div>}
