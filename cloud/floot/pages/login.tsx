import { useEffect,useState,useRef } from "react";
import { Link,useNavigate,useSearchParams } from "react-router-dom";
import { z } from "zod";
import { X,Eye,EyeOff } from "lucide-react";
import { useViewportHeight } from "../helpers/useVisualViewport";
import { PageControls } from "../components/PageControls";
import { AppHead } from "../components/AppHead";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Form,FormControl,FormItem,FormLabel,FormMessage,useForm } from "../components/Form";
import { PasswordResetForm } from "../components/PasswordResetForm";
import { Spinner } from "../components/Spinner";
import { postLogin } from "../endpoints/auth/login_with_password_POST.schema";
import { postRegister } from "../endpoints/auth/register_with_password_POST.schema";
import { postAccounts,type OutputType } from "../endpoints/auth/accounts_POST.schema";
import { useAuth } from "../helpers/useAuth";
import styles from "./login.module.css";
const fields=z.object({email:z.string().trim().email('Enter your email.'),password:z.string().min(1,'Enter your password.')});
export default function Login(){
 const {authState,onLogin,logout}=useAuth(),navigate=useNavigate(),[params,setParams]=useSearchParams(),register=params.get('mode')==='signup',[reset,setReset]=useState(false),[adding,setAdding]=useState(false),[remember,setRemember]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState<OutputType['accounts']>([]);
 const accountSize=useViewportHeight()<550?1:2;
 const locked=useRef(false),[show,setShow]=useState(false),[accountPage,setAccountPage]=useState(0);
 const form=useForm({schema:register?fields.extend({password:z.string().min(8,'Use at least 8 characters.')}):fields,defaultValues:{email:'',password:''}}),back=params.get('back'),destination=back&&back.startsWith('/?')?back:'/';
 useEffect(()=>{let active=true;void postAccounts({action:'list'}).then(r=>{if(active)setSaved(r.accounts);}).catch(()=>{});return()=>{active=false;};},[]);
 useEffect(()=>setAccountPage(p=>Math.min(p,Math.max(0,Math.ceil(saved.length/accountSize)-1))),[saved.length,accountSize]);
 function setRegister(value:boolean){setParams(p=>{const next=new URLSearchParams(p);if(value)next.set('mode','signup');else next.delete('mode');return next;});setError('');}
 async function save(values:z.infer<typeof fields>){if(locked.current)return;locked.current=true;setBusy(true);setError('');try{if(register&&values.password.length<8)throw new Error('Use at least 8 characters.');const result=register?await postRegister({...values,email:values.email.trim().toLowerCase(),displayName:values.email.trim().split('@')[0]}):await postLogin({...values,email:values.email.trim().toLowerCase()});onLogin(result.user);sessionStorage.setItem('ion.connect-space','yes');if(remember)await postAccounts({action:'remember'});navigate(destination,{replace:true});}catch(e){setError(e instanceof Error?e.message:'Couldn’t sign in. Try again.');}finally{locked.current=false;setBusy(false);}}
 async function keep(){setBusy(true);setError('');try{setSaved((await postAccounts({action:'remember'})).accounts);}catch(e){setError(e instanceof Error?e.message:'Couldn’t save this account.');}finally{setBusy(false);}}
 async function addAccount(){setBusy(true);setError('');try{setSaved((await postAccounts({action:'remember'})).accounts);setAdding(true);setRegister(false);setRemember(true);form.setValues({email:'',password:''});}catch(e){setError(e instanceof Error?e.message:'Couldn’t save this account.');}finally{setBusy(false);}}
 async function switchTo(userId:number){setBusy(true);setError('');try{await postAccounts({action:'switch',userId});sessionStorage.removeItem('ion.word-drafts.v1');window.location.assign(destination);}catch(e){setError(e instanceof Error?e.message:'Sign in to that account again.');setBusy(false);}}
 async function forget(userId:number){setBusy(true);setError('');try{setSaved((await postAccounts({action:'forget',userId})).accounts);}catch(e){setError(e instanceof Error?e.message:'Couldn’t forget this account.');}finally{setBusy(false);}}
 const current=authState.type==='authenticated'?authState.user:null;
 return <main className={styles.page}><AppHead title="Accounts · ION"/><div className={styles.content}>
 {authState.type==='loading'?<Spinner aria-label="Opening accounts"/>:current&&!adding?<><h1>Accounts</h1><p>{current.email}</p><p className={styles.hint}>Remembered accounts open on this device without a password.</p>{!saved.some(a=>a.id===current.id)&&<Button disabled={busy} onClick={()=>void keep()}>Keep on this device</Button>}
 <div className={styles.accounts} role="group" aria-label="Saved accounts">{saved.slice(accountPage*accountSize,accountPage*accountSize+accountSize).map(a=><div key={a.id} className={styles.saved}><Button variant="ghost" disabled={busy||a.id===current.id} onClick={()=>void switchTo(a.id)}><span>{a.email}</span>{a.id===current.id&&<small>Current</small>}</Button><Button variant="ghost" size="icon" disabled={busy} aria-label={'Forget '+a.email} onClick={()=>void forget(a.id)}><X size={16}/></Button></div>)}</div><PageControls page={accountPage} total={Math.ceil(saved.length/accountSize)} onChange={setAccountPage} label="Accounts"/>
 <Button variant="outline" disabled={busy} onClick={()=>void addAccount()}>Add account</Button><Button variant="ghost" disabled={busy} onClick={()=>void logout().catch(()=>setError('Couldn’t sign out. Try again.'))}>Sign out</Button>
 </>:reset?<PasswordResetForm defaultEmail={form.values.email} onCancel={()=>setReset(false)} onDone={()=>{setReset(false);setError('Password updated. Sign in to continue.');}}/>:<>
 <h1>{register?'Create account':'Sign in'}</h1><Link className={styles.mode} to={{pathname:'/login',search:(()=>{const q=new URLSearchParams(params);if(register)q.delete('mode');else q.set('mode','signup');return '?'+q.toString();})()}} onClick={()=>{setError('');form.setFieldError('email','');form.setFieldError('password','');}}>{register?'Already have an account? Sign in':'Create an account'}</Link>
 {!adding&&saved.length>0&&<div className={styles.accounts} role="group" aria-label="Saved accounts">{saved.slice(accountPage*accountSize,accountPage*accountSize+accountSize).map(a=><div key={a.id} className={styles.saved}><Button variant="ghost" disabled={busy} onClick={()=>void switchTo(a.id)}>{a.email}</Button><Button variant="ghost" size="icon" disabled={busy} aria-label={'Forget '+a.email} onClick={()=>void forget(a.id)}><X size={16}/></Button></div>)}</div>}{!adding&&saved.length>accountSize&&<PageControls page={accountPage} total={Math.ceil(saved.length/accountSize)} onChange={setAccountPage} label="Accounts"/>}
 <Form {...form}><form aria-label={register?'Create account':'Sign in'} noValidate onSubmit={form.handleSubmit(save)}>
 <FormItem className={styles.field} name="email"><FormLabel className={styles.srOnly}>Email</FormLabel><FormControl><Input placeholder="Email" type="email" autoComplete="email" inputMode="email" value={form.values.email} readOnly={busy} onChange={e=>form.setValues(v=>({...v,email:e.target.value}))}/></FormControl><FormMessage/></FormItem>
 <FormItem name="password" className={styles.passwordField+' '+styles.field}><FormLabel className={styles.srOnly}>Password</FormLabel><FormControl><Input placeholder="Password" type={show?'text':'password'} autoComplete={register?'new-password':'current-password'} value={form.values.password} readOnly={busy} onChange={e=>form.setValues(v=>({...v,password:e.target.value}))}/></FormControl><Button className={styles.reveal} variant="ghost" size="icon" aria-label={show?'Hide password':'Show password'} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</Button><FormMessage/></FormItem>
 {register&&<p className={styles.hint}>At least 8 characters.</p>}
 <div className={styles.options}><Button variant={remember?'secondary':'ghost'} aria-label="Remember this account" aria-pressed={remember} disabled={busy} onClick={()=>setRemember(!remember)}>Remember</Button><Button variant="link" disabled={busy} onClick={()=>setReset(true)}>Forgot password?</Button></div>
 <Button type="submit" disabled={busy} aria-busy={busy}>{busy?(register?'Creating…':'Signing in…'):register?'Create account':'Sign in'}</Button>{adding&&<Button variant="ghost" disabled={busy} onClick={()=>setAdding(false)}>Cancel</Button>}
 </form></Form></>}
 {error&&<p className={styles.error} role="alert">{error}</p>}
 <Button variant="ghost" asChild className={styles.back}><Link to={destination}>Back</Link></Button>
 </div></main>;
}
