import {nearbyDestinations} from './nearbyDestinations';
import type {CloudNode} from '../endpoints/cloud_POST.schema';
describe('Nearby Move and Duplicate destinations',()=>{
 const nodes:CloudNode[]=[{id:'root',parentId:null,name:'Safari'},{id:'far',parentId:'root',name:'Far'},{id:'farther',parentId:'far',name:'Remote'},{id:'near',parentId:'root',name:'Here'},{id:'source',parentId:'near',name:'Source'},{id:'child',parentId:'source',name:'Inside'},{id:'sibling',parentId:'near',name:'Next door',identifier:'IL09'},{id:'deep',parentId:'sibling',name:'Below'}],source=nodes[4];
 it('starts with the current location and adjacent branches, excluding the moved branch',()=>{const ids=nearbyDestinations(nodes,source,{}).map(n=>n.id);expect(ids[0]).toBe('near');expect(ids.indexOf('sibling')).toBeLessThan(ids.indexOf('farther'));expect(ids).not.toContain('source');expect(ids).not.toContain('child');});
 it('keeps IL/name search and cross-section roots available',()=>{expect(nearbyDestinations(nodes,source,{query:'IL09'}).map(n=>n.id)).toEqual(['sibling']);expect(nearbyDestinations(nodes,source,{cross:true})[0].id).toBe('root');});
});
