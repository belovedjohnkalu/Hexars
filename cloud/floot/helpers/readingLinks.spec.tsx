import {readingLinks} from './readingLinks';
describe('Clickable reading references',()=>{
 it('keeps a full destination when pagination splits a URL',()=>{const source='Read https://www.kruzno.com/hexcheckers.html .';const parts=readingLinks(source,12,20);expect(parts.some(p=>p.href==='https://www.kruzno.com/hexcheckers.html')).toBeTrue();expect(parts.map(p=>p.text).join('')).toBe(source.slice(12,32));});
 it('retains internal here links without treating unsafe schemes as URLs',()=>{const source='Policies here. javascript:alert(1)';expect(readingLinks(source,0,source.length,{label:'here',to:'/?il=IL01'}).find(p=>p.text==='here')?.href).toBe('/?il=IL01');expect(readingLinks('javascript:alert(1)',0,19).some(p=>p.href)).toBeFalse();});
});
