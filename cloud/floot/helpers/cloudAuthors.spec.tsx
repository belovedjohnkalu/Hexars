import { attachCloudAuthors } from './cloudAuthors';
describe('Public authorship',()=>{
 it('shows public names without leaking account details or turning moves into new posts',()=>{const n={id:'a',parentId:'public',name:'Word',createdBy:7};expect(attachCloudAuthors([n],new Map([[7,'North Star']]))[0].author).toEqual({name:'North Star'});expect(attachCloudAuthors([{...n,parentId:'elsewhere'}],new Map([[7,'North Star']]))[0].author?.name).toBe('North Star');});
 it('never displays an email and handles old/deleted authors without inventing ownership',()=>{expect(attachCloudAuthors([{id:'a',parentId:null,name:'Word',createdBy:7}],new Map([[7,'name@example.com']]))[0].author?.name).toBe('Member');expect(attachCloudAuthors([{id:'a',parentId:null,name:'Word',createdBy:9}],new Map())[0].author?.name).toBe('Member');expect(attachCloudAuthors([{id:'a',parentId:null,name:'Word'}],new Map())[0].author).toBeUndefined();});
});
