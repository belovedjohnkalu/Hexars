import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {CloudActions} from '../components/CloudActions';
describe('Words and multimedia editing',()=>{
 const originalEvent=globalThis.Event,originalCustom=globalThis.CustomEvent;
 beforeEach(()=>{globalThis.Event=window.Event;globalThis.CustomEvent=window.CustomEvent;});afterEach(()=>{cleanup();globalThis.Event=originalEvent;globalThis.CustomEvent=originalCustom;});
 it('keeps the wheel on both tabs and preserves existing notes without a new text field',()=>{
 render(<CloudActions node={{id:'word',parentId:'private',name:'A word',note:'Existing paragraph'}} nodes={[]} scope="private" version={1} mode="rename" count={1} busy={false} error="" onClose={()=>{}} onRename={async()=>true} onRemove={async()=>true} onRelocate={async()=>true} loadTarget={async()=>({nodes:[],version:0})} onEdit={async()=>true} dev/>);
 expect(screen.queryByRole('textbox',{name:/note|additional text/i})).toBeNull();expect(screen.getByRole('slider')).not.toBeNull();fireEvent.click(screen.getByRole('button',{name:'Media'}));expect(screen.getByRole('slider')).not.toBeNull();expect(screen.getByRole('button',{name:'Choose media'})).not.toBeNull();expect(screen.queryByRole('textbox',{name:/note|additional text/i})).toBeNull();
 });
});
