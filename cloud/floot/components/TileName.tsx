import {useCloudHold} from '../helpers/useCloudHold';
import {requestPageAction} from '../helpers/pageWorkspaceEvents';
import styles from './TileName.module.css';
export function TileName({name}:{name:string}){const hold=useCloudHold(()=>requestPageAction({action:'tile-rename'}));return <button type="button" data-tile-name className={styles.name} {...hold.handlers({id:'current-tile-name',name,parentId:null})} onClick={()=>requestPageAction({action:'tiles'})} aria-label={'Tile: '+name}>{name}</button>;}
