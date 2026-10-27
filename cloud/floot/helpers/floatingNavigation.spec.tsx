import {cleanup,render,screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {FloatingBack} from '../components/FloatingBack';
import {hierarchyNavigation} from './hierarchyNavigation';
import {paneNavigation} from './paneNavigation';
import {deviceData} from './deviceData';
import {CLOUD_HOLD_MS} from './useCloudHold';
describe('Hierarchy arrows and independent visited history',()=>{
 let original:string;
 beforeEach(()=>{original=location.pathname+location.search+location.hash;paneNavigation.clear();hierarchyNavigation.clear();deviceData.setIdentity(null);});
 afterEach(()=>{cleanup();history.replaceState(null,'',original);hierarchyNavigation.clear();paneNavigation.clear();});
 it('ascends to the real parent regardless of the last visited page',()=>{history.replaceState({idx:4},'','/?cloud=droplet');render(<BrowserRouter><FloatingBack to="/?cloud=parent"/></BrowserRouter>);expect(screen.getByRole('link',{name:'Up'}).getAttribute('href')).toBe('/?cloud=parent');});
 it('remembers a direct previously opened droplet independently in each screen',()=>{hierarchyNavigation.record('one','/?cloud=child','/?cloud=parent');expect(hierarchyNavigation.child('one','/?cloud=parent')).toBe('/?cloud=child');expect(hierarchyNavigation.child('two','/?cloud=parent')).toBeNull();hierarchyNavigation.record('one','/?cloud=controls&selected=one','/?cloud=parent');expect(hierarchyNavigation.child('one','/?cloud=parent')).toBe('/?cloud=child');});
 it('disables Up at ION and exposes Down only when a droplet was opened',()=>{history.replaceState({idx:0},'','/');hierarchyNavigation.record('browser:guest','/?cloud=public','/');render(<BrowserRouter><FloatingBack root to="/"/></BrowserRouter>);expect((screen.getByRole('button',{name:'Up'}) as HTMLButtonElement).disabled).toBeTrue();expect((screen.getByRole('button',{name:'Down'}) as HTMLButtonElement).disabled).toBeFalse();});
 it('never ascends into Controls',()=>{history.replaceState(null,'','/?cloud=direct');render(<BrowserRouter><FloatingBack to={'/?cloud=controls&origin='+encodeURIComponent('/?cloud=private')}/></BrowserRouter>);expect(screen.getByRole('link',{name:'Up'}).getAttribute('href')).toBe('/?cloud=private');});
 it('preserves the quick deliberate hold',()=>{expect(CLOUD_HOLD_MS).toBe(180);});
});
