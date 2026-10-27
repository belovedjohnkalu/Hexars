import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { Input } from './Input';
import { Switch } from './Switch';
import { Spinner } from './Spinner';
import { PagedText } from './PagedText';
import { PageControls } from './PageControls';
import { postCommunity, type CommunitySettings, type CommunityResult } from '../endpoints/community_POST.schema';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import styles from './ChessHubSettings.module.css';

export function ChessHubSettings({dev,nodes}:{dev:boolean;nodes:CloudNode[]}) {
  const [tab,setTab]=useState<'settings'|'reports'|'insights'>('settings'),[data,setData]=useState<CommunityResult>({}),[config,setConfig]=useState<CommunitySettings|null>(null),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState(''),[page,setPage]=useState(0),[report,setReport]=useState<NonNullable<CommunityResult['reports']>[number]|null>(null),[post,setPost]=useState<CommunityResult|null>(null),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    if(!dev)return;const abort=new AbortController();setLoading(true);setError('');setNotice('');setReport(null);setPost(null);
    void postCommunity({action:tab},abort.signal).then(result=>{if(!abort.signal.aborted){setData(result);if(result.settings)setConfig(result.settings);}}).catch(e=>{if(!abort.signal.aborted)setError(e instanceof Error?e.message:'Couldn’t open Manage.');}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();
  },[dev,tab,attempt]);
  async function save(){if(busy||!config)return;setBusy(true);setError('');setNotice('');try{const result=await postCommunity({action:'configure',...config});if(result.settings)setConfig(result.settings);setNotice('Saved');}catch(e){setError(e instanceof Error?e.message:'Couldn’t save.');}finally{setBusy(false);}}
  if(!dev)return <div className={styles.center}>This page isn’t available.</div>;
  const reports=data.reports||[],pages=Math.max(1,Math.ceil(reports.length/4)),currentPost=post?.replies?.[0]||post?.topic;
  return <section className={styles.space}>
    <nav className={styles.tabs} aria-label="Chess management">{(['settings','reports','insights'] as const).map(value=><Button key={value} variant="ghost" aria-pressed={tab===value} onClick={()=>setTab(value)}>{({settings:'Settings',reports:'Reports',insights:'Usage'})[value]}</Button>)}</nav>
    {loading?<div className={styles.center}><Spinner aria-label="Opening Manage"/></div>:tab==='settings'&&config?<form noValidate className={styles.form} onSubmit={e=>{e.preventDefault();void save();}}>
      <div className={styles.setting}><label htmlFor="chess-discussions">New posts</label><Switch id="chess-discussions" checked={config.communityEnabled} onCheckedChange={value=>setConfig({...config,communityEnabled:value})}/></div>
      {([{key:'slowSeconds',label:'Seconds between posts',min:2,max:120},{key:'searchSlots',label:'Computer searches at once',min:1,max:128},{key:'rulesSlots',label:'Board updates at once',min:1,max:256}] as const).map(field=><div className={styles.setting} key={field.key}><label htmlFor={'chess-'+field.key}>{field.label}</label><Input id={'chess-'+field.key} type="number" inputMode="numeric" min={field.min} max={field.max} value={config[field.key]} onChange={e=>setConfig({...config,[field.key]:Number(e.target.value)})}/></div>)}
      <p className={styles.hint}>These limits protect the app. Hosting quotas must also support them.</p>
      <div className={styles.actions}><Button disabled={busy||config.slowSeconds<2||config.slowSeconds>120||config.searchSlots<1||config.searchSlots>128||config.rulesSlots<1||config.rulesSlots>256} type="submit">{busy?'Saving…':'Save'}</Button><Button asChild variant="ghost"><Link to="/?cloud=chess-labels&space=chess">{nodes.find(n=>n.id==='chess-labels')?.name||'Words'}</Link></Button></div>
    </form>:tab==='reports'?report&&currentPost?<div className={styles.review}><h2>{'title'in currentPost?currentPost.title:currentPost.author.name}</h2><div className={styles.read}><PagedText text={currentPost.body||''}/></div><div className={styles.actions}><Button variant="ghost" disabled={busy} onClick={()=>{setReport(null);setPost(null);}}>Back</Button><Button variant="ghost" disabled={busy} onClick={()=>void moderate()}>{currentPost.visibility==='visible'?'Hide':'Restore'}</Button><Button disabled={busy} onClick={()=>void resolve()}>Resolve</Button></div></div>:<><div className={styles.reports}>{reports.slice(page*4,page*4+4).map(item=><Button variant="ghost" key={item.id} onClick={()=>{setBusy(true);setError('');void postCommunity({action:'inspect',topicId:item.topicId,...(item.replyId?{replyId:item.replyId}:{})}).then(r=>{setReport(item);setPost(r);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}><span>{item.title}</span><small>{item.reason}</small></Button>)}{!reports.length&&<p>Nothing here yet</p>}</div><PageControls page={Math.min(page,pages-1)} total={pages} onChange={setPage} label="Reports"/></>:data.insights?<div className={styles.stats}><div><strong>{data.insights.playersToday}</strong><span>Players today</span></div><div><strong>{data.insights.returnRate===null?'—':(data.insights.returnRate*100).toFixed(1)+'%'}</strong><span>Returned within 7 days</span></div><p className={styles.hint}>{data.insights.returned} of {data.insights.eligible} eligible accounts. Based on playing on a later UTC day, within seven days of the first. Measurement starts with this release; cohorts mature after seven days.</p></div>:null}
    <div className={styles.feedback} role="status">{notice}</div>{error&&<div className={styles.error} role="alert">{error}<Button variant="ghost" onClick={()=>setAttempt(x=>x+1)}>Retry</Button></div>}
  </section>;
  async function moderate(){if(!report||!currentPost)return;setBusy(true);setError('');try{await postCommunity({action:'moderate',topicId:report.topicId,...(report.replyId?{replyId:report.replyId}:{}),version:currentPost.version,visibility:currentPost.visibility==='visible'?'hidden':'visible'});const result=await postCommunity({action:'inspect',topicId:report.topicId,...(report.replyId?{replyId:report.replyId}:{})});setPost(result);setNotice('Saved');}catch(e){setError(e instanceof Error?e.message:'Couldn’t update.');}finally{setBusy(false);}}
  async function resolve(){if(!report)return;setBusy(true);setError('');try{await postCommunity({action:'resolve',id:report.id});setData(old=>({...old,reports:old.reports?.filter(r=>r.id!==report.id)}));setReport(null);setPost(null);setPage(0);setNotice('Resolved');}catch(e){setError(e instanceof Error?e.message:'Couldn’t resolve.');}finally{setBusy(false);}}
}
