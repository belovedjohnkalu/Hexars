import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {FloatingBack} from '../components/FloatingBack';
import {clearVisitedPages,recordVisitedPage} from './visitedPages';
import {CLOUD_HOLD_MS} from './useCloudHold';
describe('Floating Safari-style navigation',()=>{
 let original:string;
 beforeEach(()=>{original=location.pathname+location.search+location.hash;clearVisitedPages();});
 afterEach(()=>{cleanup();history.replaceState(null,'',original);clearVisitedPages();});
 it('morphs from Back to Back and Forward after returning to an earlier cloud',()=>{
  history.replaceState({idx:2},'','/?cloud=last');recordVisitedPage(0,'/',true);recordVisitedPage(1,'/?cloud=previous',true);recordVisitedPage(2,'/?cloud=last',true);
  const go=spyOn(history,'go').and.stub();const view=render(<BrowserRouter><FloatingBack to="/"/></BrowserRouter>);
  expect(view.container.querySelector('[data-forward]')?.getAttribute('data-forward')).toBe('false');expect(screen.queryByRole('button',{name:'Forward',exact:true})).toBeNull();
  fireEvent.click(screen.getByRole('link',{name:'Back',exact:true}));expect(go).toHaveBeenCalledWith(-1);
  act(()=>{history.replaceState({idx:1},'','/?cloud=previous');recordVisitedPage(1,'/?cloud=previous');});
  expect(view.container.querySelector('[data-forward]')?.getAttribute('data-forward')).toBe('true');fireEvent.click(screen.getByRole('button',{name:'Forward',exact:true}));expect(go).toHaveBeenCalledWith(1);
  act(()=>{history.replaceState({idx:2},'','/?cloud=new');recordVisitedPage(2,'/?cloud=new',true);});
  expect(screen.queryByRole('button',{name:'Forward',exact:true})).toBeNull();
 });
 it('retains a safe local fallback for direct entry',()=>{history.replaceState({idx:0},'','/?cloud=direct');render(<BrowserRouter><FloatingBack to={'/?cloud=controls&origin='+encodeURIComponent('/?cloud=private')}/></BrowserRouter>);expect(screen.getByRole('link',{name:'Back',exact:true}).getAttribute('href')).toBe('/?cloud=private');});
 it('keeps Forward available after returning to ION, with Back disabled on its first entry',()=>{history.replaceState({idx:0},'','/');recordVisitedPage(0,'/',true);recordVisitedPage(1,'/?cloud=public',true);recordVisitedPage(0,'/');render(<BrowserRouter><FloatingBack root to="/"/></BrowserRouter>);expect((screen.getByRole('button',{name:'Back',exact:true}) as HTMLButtonElement).disabled).toBeTrue();expect((screen.getByRole('button',{name:'Forward',exact:true}) as HTMLButtonElement).disabled).toBeFalse();});
 it('opens Controls with a substantially shorter deliberate hold',()=>{expect(CLOUD_HOLD_MS).toBe(180);});
});
