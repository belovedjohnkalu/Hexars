import {CloudUpload,CircleAlert} from 'lucide-react';
import styles from './CloudPublishingStatus.module.css';
export function CloudPublishingStatus({state}:{state:'pending'|'failed'}){return <span className={styles.status} data-upload-state={state} role="status" aria-label={state==='failed'?'Failed to publish':'Sending'}>{state==='failed'?<CircleAlert size={20} aria-hidden="true"/>:<CloudUpload size={20} aria-hidden="true"/>}</span>;}
