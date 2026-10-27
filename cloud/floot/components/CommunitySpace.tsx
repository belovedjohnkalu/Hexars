import {communityIdentity} from '../helpers/communityIdentity';
import {communityUndo} from '../helpers/communityUndo';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, Bookmark, ChevronRight, Ellipsis, Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './Dialog';
import { CloudCanvas } from './CloudCanvas';
import { PagedText } from './PagedText';
import { Spinner } from './Spinner';
import { useCommunity } from '../helpers/useCommunity';
import { useCloudHold, useCloudHoldGuard } from '../helpers/useCloudHold';
import { cloudURL, controlsURL } from '../helpers/cloudRoutes';
import { deviceData } from '../helpers/deviceData';
import type { CloudNode } from '../endpoints/cloud_POST.schema';
import type { CommunityTopic, CommunityReply } from '../endpoints/community_POST.schema';
import styles from './CommunitySpace.module.css';

type Selection={topic:CommunityTopic;reply?:CommunityReply};
const excerpt=(text:string)=>{const words=text.split(/\s+/);return words.slice(0,10).join(' ')+(words.length>10?'…':'');};
export function CommunitySpace({roomId,nodes,userId,dev=false,className=''}:{roomId:string;nodes:CloudNode[];userId:number|null;dev?:boolean;className?:string}) {
  useCloudHoldGuard();
  const [compactReader,setCompactReader]=useState(()=>typeof matchMedia==='function'&&matchMedia('(max-height:600px)').matches);
  useEffect(()=>{const media=matchMedia('(max-height:600px)'),update=()=>setCompactReader(media.matches);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
  const location=useLocation(),navigate=useNavigate(),params=new URLSearchParams(location.search),topicId=params.get('topic'),cursor=params.get('after'),replyId=params.get('reply');
  const undo=useSyncExternalStore(communityUndo.subscribe,()=>communityUndo.get(userId));
  const live=useCommunity(roomId,topicId,cursor,userId,replyId),topic=live.data.topic;
  const [selection,setSelection]=useState<Selection|null>(null),[sheet,setSheet]=useState<'actions'|'read'|'edit'|'remove'|'report'|'move'|'replies'|null>(null),[writing,setWriting]=useState(false),[title,setTitle]=useState(''),[body,setBody]=useState(''),[notice,setNotice]=useState(''),[editTitle,setEditTitle]=useState(''),[editBody,setEditBody]=useState('');
  const pending=useRef<{key:string;id:string}|null>(null),draftKey='community-draft:'+roomId+':'+(topicId||'new'),current=useRef('');current.current=String(userId)+':'+draftKey;
  const draftReady=useRef(false),firstField=useRef<HTMLInputElement|null>(null),textField=useRef<HTMLTextAreaElement|null>(null);
  const hold=useCloudHold(node=>{const t=live.data.topics?.find(t=>communityIdentity.topic(t.id)===node.id);if(t){setSelection({topic:t});setSheet('actions');return;}const reply=live.data.replies?.find(r=>communityIdentity.reply(r.id)===node.id);if(topic&&reply){setSelection({topic,reply});setSheet('actions');}});
  const editLabelHold=useCloudHold(node=>{if(dev){setWriting(false);setSheet(null);navigate(controlsURL(node,'chess',location.pathname+location.search));}});
  const name=(id:string,fallback:string)=>nodes.find(n=>n.id==='chess-action-'+id)?.name||fallback;
  function labelHold(id:string){const n=nodes.find(n=>n.id==='chess-action-'+id);return dev&&n?editLabelHold.handlers(n):{};}
  useEffect(()=>{
    const own=String(userId)+':'+draftKey;draftReady.current=false;setTitle('');setBody('');setWriting(false);setSelection(null);setSheet(null);pending.current=null;setNotice('');
    if(!userId){draftReady.current=true;return;}
    void deviceData.get<{title:string;body:string}>(String(userId),draftKey).then(draft=>{if(current.current===own){setTitle(draft?.title||'');setBody(draft?.body||'');draftReady.current=true;}});
  },[userId,draftKey]);
  useEffect(()=>{if(!userId||!draftReady.current)return;const timer=setTimeout(()=>void deviceData.put(String(userId),draftKey,{title,body}),350);return()=>clearTimeout(timer);},[title,body,draftKey,userId]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);
  useEffect(()=>{const reply=live.data.replies?.find(r=>r.id===replyId);if(reply&&topic){setSelection({topic,reply});setSheet('read');}},[replyId,topic?.id]);
  const url=(id?:string,after?:string)=>{const p=new URLSearchParams({cloud:roomId,space:'chess',...(id?{topic:id}:{}),...(after?{after}:{})});return '/?'+p;};
  const topicURL=(t:CommunityTopic)=>'/?'+new URLSearchParams({cloud:t.roomId,space:'chess',topic:t.id});
  const signin='/login?mode=signin&back='+encodeURIComponent(location.pathname+location.search);
  const canChange=!!selection&&(dev||(selection.reply?.author.id??selection.topic.author.id)===userId);
  const target=selection?{topicId:selection.topic.id,...(selection.reply?{replyId:selection.reply.id}:{}),version:selection.reply?.version??selection.topic.version}:null;
  const il=selection?.reply?.il||selection?.topic.il;
  async function copy(value:string){try{await navigator.clipboard.writeText(value);setNotice('Copied');setSheet(null);}catch{setNotice('Couldn’t copy. Try again.');}}
  async function send(){
    if(!userId||!body.trim()||!topicId&&!title.trim()||live.busy)return;
    const key=JSON.stringify([topicId,title.trim(),body.trim()]);if(pending.current?.key!==key)pending.current={key,id:crypto.randomUUID()};
    const result=await live.execute(topicId?{action:'reply',id:pending.current.id,topicId,body:body.trim()}:{action:'topic',id:pending.current.id,roomId,title:title.trim(),body:body.trim()});
    if(!result)return;setWriting(false);setTitle('');setBody('');pending.current=null;await deviceData.remove(String(userId),draftKey);
    if(result.topic&&!topicId)navigate(url(result.topic.id));else setNotice('Posted');
  }
  const feedNodes:CloudNode[]=(topic?live.data.replies||[]:live.data.topics||[]).map(item=>('title'in item?{id:communityIdentity.topic(item.id),parentId:roomId,name:item.title+'\n'+item.author.name,identifier:item.il,sizeCharacters:item.characters,color:item.pinned?'amber':'blue',href:topicURL(item)}:{id:communityIdentity.reply(item.id),parentId:topicId,name:item.author.name+'\n'+excerpt(item.body),identifier:item.il,color:'cyan',href:url(topicId!)}));
  const repliesCanvas=topic?<CloudCanvas identity={String(userId||'guest')} nodes={feedNodes} scope="chess" parentId={topicId} loading={false} opening={null} showIdentifiers={dev} onHighlight={node=>{const reply=live.data.replies?.find(r=>communityIdentity.reply(r.id)===node.id);if(reply){setSelection({topic,reply});setSheet('actions');}}} onOpen={(e,id)=>{e.preventDefault();const reply=live.data.replies?.find(r=>communityIdentity.reply(r.id)===id);if(reply){setSelection({topic,reply});setSheet('read');}}}/>:null;
  return <section className={styles.space+' '+className} data-community={roomId} data-topic={topicId||''} data-has-replies={!!live.data.replies?.length}>
    {live.loading?<div className={styles.center}><Spinner aria-label="Opening Community"/></div>:topic?<>
      <header className={styles.topicHeader}><div className={styles.heading}><PagedText key={topic.id} heading text={topic.title}/></div><div className={styles.byline}><span>{topic.author.name}</span>{topic.locked&&<span>Closed</span>}<Button variant="ghost" size="icon" aria-label="Discussion options" {...hold.handlers({id:communityIdentity.topic(topic.id),parentId:roomId,name:topic.title})} onClick={()=>{setSelection({topic});setSheet('actions');}}><Ellipsis size={22}/></Button></div></header>
      <article className={styles.body}><PagedText key={topic.id} text={topic.body||''}/></article>
      {!compactReader&&!!live.data.replies?.length&&<div className={styles.replies}>{repliesCanvas}</div>}
    </>:<div className={styles.feed}>
      {roomId==='chess-following'&&!userId?<div className={styles.center}><Button asChild><Link to={signin}>Sign in</Link></Button></div>:!live.data.topics?.length&&!live.error?<div className={styles.center}><p>{name('empty','Nothing here yet')}</p></div>:<CloudCanvas identity={String(userId||'guest')} nodes={feedNodes} scope="chess" parentId={roomId} loading={false} opening={null} showIdentifiers={dev} onHighlight={node=>{const t=live.data.topics?.find(t=>communityIdentity.topic(t.id)===node.id);if(t){setSelection({topic:t});setSheet('actions');}}} onOpen={(e,id)=>{e.preventDefault();const target=live.data.topics?.find(t=>communityIdentity.topic(t.id)===id);if(target)navigate(topicURL(target));}}/>}
    </div>}
    <div className={styles.feedback} aria-live="polite">{notice}</div>
    {live.error&&<div className={styles.error} role="alert"><span>{live.error}</span><Button variant="ghost" size="sm" onClick={()=>void live.reload()}>Retry</Button></div>}
    <nav className={styles.toolbar} aria-label="Discussion actions">
      {undo&&<Button variant="ghost" disabled={live.busy} onClick={()=>void live.execute({action:'restore',topicId:undo.topicId,replyId:undo.replyId,version:undo.version,undoToken:undo.undoToken}).then(r=>{if(r)navigate(url(undo.topicId));})}>Undo deletion</Button>}
      {cursor&&<Button asChild variant="ghost"><Link to={url(topicId||undefined)}>First</Link></Button>}
      {live.fresh&&<Button variant="ghost" onClick={()=>navigate(url(topicId||undefined))}>New posts</Button>}
      {live.data.next&&<Button asChild variant="ghost"><Link to={url(topicId||undefined,live.data.next)}>More<ChevronRight size={17}/></Link></Button>}
      {compactReader&&topic&&!!live.data.replies?.length&&<Button className={styles.repliesToggle} variant="ghost" onClick={()=>{setSelection({topic});setSheet('replies');}}>Replies · {topic.replies}</Button>}
      {topic&&userId&&<Button variant="ghost" disabled={live.busy} aria-pressed={live.following} aria-label={live.following?'Unfollow discussion':'Follow discussion'} onClick={()=>void live.execute({action:'follow',topicId:topic.id,value:!live.following})}><Bookmark size={19} fill={live.following?'currentColor':'none'}/></Button>}
      {!live.loading&&(!!topic||roomId!=='chess-following')&&(!topic||!topic.locked||dev)&&(userId?<Button variant="ghost" {...labelHold(topic?'reply':'new')} onClick={()=>setWriting(true)}><Plus size={18}/>{name(topic?'reply':'new',topic?'Reply':'New discussion')}</Button>:<Button asChild variant="ghost"><Link to={signin}>{name('signin','Sign in to join')}</Link></Button>)}
    </nav>
    <Dialog open={writing} onOpenChange={open=>{if(!live.busy)setWriting(open);}}><DialogContent className={styles.sheet} closeDisabled={live.busy} onOpenAutoFocus={e=>{e.preventDefault();(topicId?textField.current:firstField.current)?.focus();}}><DialogTitle>{name(topicId?'reply':'new',topicId?'Reply':'New discussion')}</DialogTitle><DialogDescription>Public. Keep personal details private.</DialogDescription><form noValidate className={styles.form} onSubmit={e=>{e.preventDefault();void send();}}>
      {!topicId&&<><label htmlFor="discussion-title">Title</label><Input ref={firstField} id="discussion-title" value={title} onChange={e=>setTitle(e.target.value)} maxLength={240} autoComplete="off" aria-invalid={!title.trim()&&!!live.error} aria-describedby={live.error?'community-write-error':undefined}/></>}
      <label htmlFor="discussion-words">Words</label><Textarea ref={textField} id="discussion-words" disableResize value={body} onChange={e=>setBody(e.target.value)} maxLength={12000} rows={6} aria-describedby={live.error?'community-write-error':undefined}/>
      {live.error&&<p id="community-write-error" role="alert" className={styles.error}>{live.error}</p>}
      <Button type="submit" disabled={live.busy||!body.trim()||!topicId&&!title.trim()}>{live.busy?'Posting…':name('post','Post')}</Button>
    </form></DialogContent></Dialog>
    <Dialog open={!!sheet&&!!selection} onOpenChange={open=>{if(!open&&!live.busy)setSheet(null);}}><DialogContent className={styles.sheet} closeDisabled={live.busy}>
      <DialogTitle>{sheet==='replies'?'Replies':sheet==='read'?selection?.reply?.author.name:sheet==='remove'?'Delete this post?':sheet==='report'?'Report':sheet==='edit'?'Edit':selection?.reply?.author.name||'Discussion'}</DialogTitle>
      <DialogDescription>{sheet==='remove'?'This post will be removed from Community.':sheet==='report'?'Choose a reason. Dev accounts will review it.':sheet==='read'?'Reply':selection?.topic.author.name||'Discussion options'}</DialogDescription>
      {sheet==='replies'?<div className={styles.replySheet}>{repliesCanvas}</div>:sheet==='read'?<div className={styles.read}><PagedText text={selection?.reply?.body||''}/><Button variant="ghost" onClick={()=>setSheet('actions')}>Options</Button></div>:sheet==='actions'?<div className={styles.options}>
        {selection&&<Button variant="ghost" onClick={()=>{const link=il?window.location.origin+'/?il='+il:window.location.origin+topicURL(selection.topic);if(navigator.share)void navigator.share({title:selection.topic.title,url:link}).catch(e=>{if(e.name!=='AbortError')void copy(link);});else void copy(link);}}><ArrowUpRight size={18}/>{name('share','Share')}</Button>}
        {il&&<Button variant="ghost" onClick={()=>void copy(il)}>{name('copy-il','Copy IL')}</Button>}
        {userId&&<Button variant="ghost" onClick={()=>void live.execute({action:'follow',topicId:selection!.topic.id,value:true}).then(r=>{if(r){setSheet(null);setNotice('Following');}})}>{name('follow','Follow')}</Button>}
        {canChange&&<><Button variant="ghost" {...labelHold('edit')} onClick={()=>{setEditTitle(selection!.topic.title);setEditBody(selection!.reply?.body||selection!.topic.body||'');if(!selection!.reply&&!selection!.topic.body)void getTopicForEdit();else setSheet('edit');}}>{name('edit','Edit')}</Button><Button variant="ghost" {...labelHold('delete')} onClick={()=>setSheet('remove')}>{name('delete','Delete')}</Button></>}
        {userId&&<Button variant="ghost" onClick={()=>setSheet('report')}>{name('report','Report')}</Button>}
        {dev&&target&&!selection?.reply&&<><Button variant="ghost" onClick={()=>setSheet('move')}>Move</Button><Button variant="ghost" onClick={()=>void moderate({pinned:!selection!.topic.pinned})}>{selection?.topic.pinned?'Unpin':'Pin'}</Button><Button variant="ghost" onClick={()=>void moderate({locked:!selection!.topic.locked})}>{selection?.topic.locked?'Open replies':'Close replies'}</Button><Button variant="ghost" onClick={()=>void moderate({visibility:selection!.topic.visibility==='visible'?'hidden':'visible'})}>{selection?.topic.visibility==='visible'?'Hide':'Restore'}</Button></>}
        {dev&&target&&selection?.reply&&<Button variant="ghost" onClick={()=>void moderate({visibility:selection!.reply!.visibility==='visible'?'hidden':'visible'})}>{selection?.reply.visibility==='visible'?'Hide':'Restore'}</Button>}
      </div>:sheet==='edit'?<form noValidate className={styles.form} onSubmit={e=>{e.preventDefault();if(target)void live.execute({action:'edit',...target,...(!selection?.reply?{title:editTitle}:{}),body:editBody}).then(r=>{if(r){setSheet(null);void live.reload();}});}}>{!selection?.reply&&<><label htmlFor="edit-discussion-title">Title</label><Input id="edit-discussion-title" value={editTitle} onChange={e=>setEditTitle(e.target.value)} maxLength={240}/></>}<label htmlFor="edit-discussion-words">Words</label><Textarea id="edit-discussion-words" disableResize rows={6} value={editBody} onChange={e=>setEditBody(e.target.value)} maxLength={12000}/><Button type="submit" disabled={live.busy||!editBody.trim()||!selection?.reply&&!editTitle.trim()}>Save</Button></form>:sheet==='remove'?<div className={styles.options}><Button variant="ghost" disabled={live.busy} onClick={()=>setSheet('actions')}>Keep</Button><Button disabled={live.busy} onClick={()=>{if(target)void live.execute({action:'remove',...target}).then(r=>{if(r){setSheet(null);if(!selection?.reply)navigate(url());else void live.reload();}});}}>Delete</Button></div>:sheet==='move'?<div className={styles.options}>{nodes.filter(n=>n.parentId==='chess-community'&&!['chess-settings','chess-guidelines','chess-following'].includes(n.id)).map(n=><Button key={n.id} variant="ghost" disabled={live.busy} onClick={()=>{if(target)void live.execute({action:'moderate',...target,roomId:n.id}).then(r=>{if(r){setSheet(null);navigate('/?'+new URLSearchParams({cloud:n.id,space:'chess',topic:target.topicId}));}});}}>{n.name}</Button>)}</div>:sheet==='report'?<div className={styles.options}>{(['spam','abuse','unsafe','other'] as const).map(reason=><Button key={reason} variant="ghost" disabled={live.busy} onClick={()=>{if(target)void live.execute({action:'report',id:crypto.randomUUID(),topicId:target.topicId,...(target.replyId?{replyId:target.replyId}:{}),reason}).then(r=>{if(r){setSheet(null);setNotice('Reported');}});}}>{({spam:'Spam',abuse:'Harassment',unsafe:'Unsafe content',other:'Something else'})[reason]}</Button>)}</div>:null}
      {live.error&&<p className={styles.error} role="alert">{live.error}</p>}
    </DialogContent></Dialog>
  </section>;
  async function getTopicForEdit(){const {getCommunity}=await import('../endpoints/community_GET.schema');try{const r=await getCommunity({topicId:selection!.topic.id});if(r.topic){setEditTitle(r.topic.title);setEditBody(r.topic.body||'');setSelection(old=>old?{...old,topic:r.topic!}:old);setSheet('edit');}}catch{setNotice('Couldn’t open this post. Try again.');}}
  async function moderate(change:{visibility?:'visible'|'hidden';pinned?:boolean;locked?:boolean}){if(!target)return;const r=await live.execute({action:'moderate',...target,...change});if(r){setSheet(null);if(change.visibility==='hidden'&&!selection?.reply)navigate(url());else void live.reload();}}
}
