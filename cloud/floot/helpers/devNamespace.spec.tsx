import {namespaceIdentifier} from './cloudIdentifiers';
describe('Immutable dev namespaces',()=>{
 it('gives the first dev one-based Home roots and preserves existing descendant suffixes',()=>{expect(['IL0','IL1','IL2','IL3','IL4'].map(label=>namespaceIdentifier(label,0))).toEqual(['IL01','IL02','IL03','IL04','IL05']);expect(namespaceIdentifier('IL201',0)).toBe('IL0301');expect(namespaceIdentifier('IL025B1',0)).toBe('IL0125B1');expect(namespaceIdentifier('IL',0)).toBe('IL0');});
 it('supports later devs and root arrival rollover without changing descendant numbering',()=>{expect(namespaceIdentifier('IL9A0',1)).toBe('IL1A0A0');expect(namespaceIdentifier('ILA00',10)).toBe('ILA0A10');expect(namespaceIdentifier(undefined,0)).toBeUndefined();});
});
