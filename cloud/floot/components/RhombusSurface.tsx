import type {CSSProperties,ReactNode} from 'react';
import type {RhombusFace} from '../helpers/rhombusMosaic';
import styles from './RhombusSurface.module.css';
export function RhombusSurface({face,children}:{face:RhombusFace;children?:ReactNode}){return <><svg data-rhombus-surface className={styles.surface} data-plane={face.plane} viewBox={'0 0 '+face.width+' '+face.height} aria-hidden="true"><polygon data-rhombus-shape points={face.polygon}/></svg>{children!==undefined&&<span data-printed-plane className={styles.printed} style={{width:face.side,height:face.side,transform:face.matrix,'--face-side':face.side+'px'} as CSSProperties}>{children}</span>}</>;}
