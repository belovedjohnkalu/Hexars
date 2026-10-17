import { useEffect,useState } from "react";
import { Link,useNavigate,useSearchParams } from "react-router-dom";
import { z } from "zod";
import { X } from "lucide-react";
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
 const {authState,onLogin,logout}=useAuth(),navigate=useNavigate(),[params]=useSearchParams(),[register,setRegister]=useState(false),[reset,setReset]=useState(false),[adding,setAdding]=useState(false),[remember,setRemember]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState<OutputType['accounts']>([]);
 const form=useForm({schema:fields,defaultValues:{email:'',password:''}}),back=params.get('back'),destination=back&&back.startsWith('/?')?back:'/';
 useEffect(()=>{let active=true;void postAccounts({action:'list'}).then(r=>{if(active)setSaved(r.accounts);}).catch(()=>{});return()=>{active=false;};},[]);
 async function save(values:z.infer<typeof fields>){setBusy(true);setError('');try{if(register&&values.password.length<8)throw new Error('Use at least 8 characters.');const result=register?await postRegister({...values,email:values.email.toLowerCase(),displayName:values.email.split('@')[0]}):await postLogin({...values,email:values.email.toLowerCase()});onLogin(result.user);sessionStorage.setItem('ion.connect-space','yes');if(remember)await postAccounts({action:'remember'});navigate(destination,{replace:true});}catch(e){setError(e instanceof Error?e.message:'Couldn’t sign in. Try again.');}finally{setBusy(false);}}
 async function keep(){setBusy(true);setError('');try{setSaved((await postAccounts({action:'remember'})).accounts);}catch(e){setError(e instanceof Error?e.message:'Couldn’t save this account.');}finally{setBusy(false);}}
 async function addAccount(){setBusy(true);setError('');try{setSaved((await postAccounts({action:'remember'})).accounts);setAdding(true);setRegister(false);setRemember(true);form.setValues({email:'',password:''});}catch(e){setError(e instanceof Error?e.message:'Couldn’t save this account.');}finally{setBusy(false);}}
 async function switchTo(userId:number){setBusy(true);setError('');try{await postAccounts({action:'switch',userId});sessionStorage.removeItem('ion.word-drafts.v1');window.location.assign(destination);}catch(e){setError(e instanceof Error?e.message:'Sign in to that account again.');setBusy(false);}}
 async function forget(userId:number){setBusy(true);setError('');try{setSaved((await postAccounts({action:'forget',userId})).accounts);}catch(e){setError(e instanceof Error?e.message:'Couldn’t forget this account.');}finally{setBusy(false);}}
 const current=authState.type==='authenticated'?authState.user:null;
 return <main className={styles.page}><AppHead title="Accounts · ION"/><div className={styles.content}>
 {authState.type==='loading'?<Spinner aria-label="Opening accounts"/>:current&&!adding?<><h1>Accounts</h1><p>{current.email}</p><p>Saved accounts open without a password on this device.</p>{!saved.some(a=>a.id===current.id)&&<Button disabled={busy} onClick={()=>void keep()}>Keep on this device</Button>}
 <div className={styles.accounts} role="group" aria-label="Saved accounts">{saved.map(a=><div key={a.id} className={styles.saved}><Button variant="ghost" disabled={busy||a.id===current.id} onClick={()=>void switchTo(a.id)}><span>{a.email}</span>{a.id===current.id&&<small>Current</small>}</Button><Button variant="ghost" size="icon" disabled={busy} aria-label={'Forget '+a.email} onClick={()=>void forget(a.id)}><X size={16}/></Button></div>)}</div>
 <Button variant="outline" disabled={busy} onClick={()=>void addAccount()}>Add account</Button><Button variant="ghost" disabled={busy} onClick={()=>void logout().catch(()=>setError('Couldn’t sign out. Try again.'))}>Sign out</Button>
 </>:reset?<PasswordResetForm defaultEmail={form.values.email} onCancel={()=>setReset(false)} onDone={()=>{setReset(false);setError('Password updated. Sign in to continue.');}}/>:<>
 <h1>{adding?'Add account':'Your private space.'}</h1><p>Sign in to open Private on any device.</p>
 {!adding&&saved.length>0&&<div className={styles.accounts} role="group" aria-label="Saved accounts">{saved.map(a=><div key={a.id} className={styles.saved}><Button variant="ghost" disabled={busy} onClick={()=>void switchTo(a.id)}>{a.email}</Button><Button variant="ghost" size="icon" disabled={busy} aria-label={'Forget '+a.email} onClick={()=>void forget(a.id)}><X size={16}/></Button></div>)}</div>}
 <Form {...form}><form noValidate onSubmit={form.handleSubmit(save)}>
 <FormItem name="email"><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" inputMode="email" value={form.values.email} readOnly={busy} onChange={e=>form.setValues(v=>({...v,email:e.target.value}))}/></FormControl><FormMessage/></FormItem>
 <FormItem name="password"><FormLabel>Password</FormLabel><FormControl><Input type="password" autoComplete={register?'new-password':'current-password'} value={form.values.password} readOnly={busy} onChange={e=>form.setValues(v=>({...v,password:e.target.value}))}/></FormControl><FormMessage/></FormItem>
 <Button variant={remember?'secondary':'ghost'} aria-pressed={remember} disabled={busy} onClick={()=>setRemember(!remember)}>Remember this account</Button><p className={styles.hint}>Saved accounts can be opened on this device without a password.</p>
 <Button type="submit" disabled={busy} aria-busy={busy}>{busy?'Opening…':register?'Create account':'Sign in'}</Button><Button variant="ghost" disabled={busy} onClick={()=>{setRegister(!register);setError('');}}>{register?'I have an account':'Create account'}</Button><Button variant="link" disabled={busy} onClick={()=>setReset(true)}>Forgot password?</Button>{adding&&<Button variant="ghost" disabled={busy} onClick={()=>setAdding(false)}>Cancel</Button>}
 </form></Form></>}
 {error&&<p className={styles.error} role="alert">{error}</p>}
 <Button variant="ghost" asChild className={styles.back}><Link to={destination}>Back</Link></Button>
 </div></main>;
}
