import type { ReactNode } from 'react';
import { Link,useLocation } from 'react-router-dom';
import { useTime } from '../helpers/useTime';
import { Button } from './Button';
import { LoadingScreen } from './LoadingScreen';
import styles from './TimeSpace.module.css';
export function TimeAccess({items,children}:{items:string[];children:ReactNode}){
 const time=useTime(),location=useLocation();
 if(!items.length)return <>{children}</>;
 if(time.loading&&!time.snapshot)return <LoadingScreen label="Opening access"/>;
 // Keep an already-authorized game mounted through a balance refresh failure.
 // Mutations still recheck access on the server; account-keyed data never crosses users.
 if(time.error&&!time.snapshot)return <div className={styles.center}><p role="alert">{time.error}</p><Button variant="ghost" onClick={time.refresh}>Retry</Button></div>;
 if(!time.snapshot)return <LoadingScreen label="Opening access"/>;
 if(time.snapshot.dev)return <>{children}</>;
 const missing=items.filter(id=>!time.snapshot!.products.some(p=>p.id===id&&p.owned)).map(id=>time.snapshot!.products.find(p=>p.id===id)??{id,name:'Feature'});
 if(!missing.length)return <>{children}</>;
 return <div className={styles.center}><p>Unlock {missing.map(p=>p.name).join(' and ')}</p>{missing.map(p=><Button key={p.id} asChild variant="ghost"><Link to={'/?'+new URLSearchParams({cloud:'time-product',space:'home',item:p.id,back:location.pathname+location.search+location.hash})}>View {p.name}</Link></Button>)}<Button asChild variant="ghost"><Link to="/?cloud=time&space=home">Time</Link></Button></div>;
}
