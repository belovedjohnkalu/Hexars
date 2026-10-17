import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { AppHead } from "../components/AppHead";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Form, FormControl, FormItem, FormLabel, FormMessage, useForm } from "../components/Form";
import { PasswordResetForm } from "../components/PasswordResetForm";
import { postLogin } from "../endpoints/auth/login_with_password_POST.schema";
import { postRegister } from "../endpoints/auth/register_with_password_POST.schema";
import { useAuth } from "../helpers/useAuth";
import styles from "./login.module.css";
const fields=z.object({email:z.string().trim().email("Enter your email."),password:z.string().min(1,"Enter your password.")});
export default function Login(){
 const {authState,onLogin,logout}=useAuth(),navigate=useNavigate(),[params]=useSearchParams();
 const [register,setRegister]=useState(false),[reset,setReset]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
 const form=useForm({schema:fields,defaultValues:{email:"",password:""}});
 const back=params.get('back'),destination=back&&back.startsWith('/?')?back:'/';
 async function save(values:z.infer<typeof fields>){setBusy(true);setError("");try{
  if(register&&values.password.length<8)throw new Error("Use at least 8 characters.");
  const result=register?await postRegister({...values,email:values.email.toLowerCase(),displayName:values.email.split('@')[0]}):await postLogin({...values,email:values.email.toLowerCase()});
  sessionStorage.setItem("ion.connect-space","yes");onLogin(result.user);navigate(destination,{replace:true});
 }catch(e){setError(e instanceof Error?e.message:"Couldn’t sign in. Try again.");}finally{setBusy(false);}}
 return <main className={styles.page}><AppHead title="Your space · ION"/><div className={styles.content}>
 {authState.type==='authenticated'?<><h1>Your space.</h1><p>{authState.user.email}</p><p>Words and pictures follow you across devices.</p><Button asChild><Link to={destination}>Open your space</Link></Button><Button variant="ghost" onClick={()=>void logout().catch(()=>setError("Couldn’t sign out. Try again."))}>Sign out</Button>{error&&<p role="alert">{error}</p>}</>:reset?<PasswordResetForm defaultEmail={form.values.email} onCancel={()=>setReset(false)} onDone={()=>{setReset(false);setError("Password updated. Sign in to continue.");}}/>:<>
 <h1>Your space.<br/><span>Everywhere.</span></h1><p>Sign in to sync words and pictures.<br/>Your current words will join your account.</p>
 <Form {...form}><form noValidate onSubmit={form.handleSubmit(save)}>
 <FormItem name="email"><FormLabel>Email</FormLabel><FormControl><Input type="email" autoComplete="email" inputMode="email" value={form.values.email} readOnly={busy} onChange={e=>form.setValues(v=>({...v,email:e.target.value}))}/></FormControl><FormMessage/></FormItem>
 <FormItem name="password"><FormLabel>Password</FormLabel><FormControl><Input type="password" autoComplete={register?'new-password':'current-password'} value={form.values.password} readOnly={busy} onChange={e=>form.setValues(v=>({...v,password:e.target.value}))}/></FormControl><FormMessage/></FormItem>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 <Button type="submit" disabled={busy} aria-busy={busy}>{busy?'Opening…':register?'Create account':'Sign in'}</Button>
 <Button variant="ghost" disabled={busy} onClick={()=>{setRegister(!register);setError("");}}>{register?'I have an account':'Create account'}</Button>
 <Button variant="link" disabled={busy} onClick={()=>setReset(true)}>Forgot password?</Button>
 </form></Form></>}
 <Button variant="ghost" asChild className={styles.back}><Link to={destination}>Back</Link></Button>
 </div></main>;
}
