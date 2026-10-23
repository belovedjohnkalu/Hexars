import { notificationRoute } from './notificationRoutes';
import { pushSubscription } from '../endpoints/push_POST.schema';
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
describe('Notification destinations and subscription shapes',()=>{
 it('opens the exact receipt or authenticated shared game without bearer tokens',()=>{expect(notificationRoute({route:'/?cloud=time-receipt&space=home&receipt='+id})).toContain('receipt='+id);const route=notificationRoute({route:'/brusky?mode=saved&game='+id+'&shareId='+id});expect(route).toContain('shareId='+id);expect(route).toContain('back=');});
 it('rejects external, script, protocol-relative and unexpected app destinations',()=>{for(const route of ['https://evil.invalid','//evil.invalid','javascript:alert(1)','/?cloud=controls','/glinski?mode=saved&share=secret','/?cloud=time-receipt&space=home&receipt=bad'])expect(notificationRoute({route})).toBeNull();});
 it('accepts web, FCM and APNs objects and rejects local callback endpoints',()=>{const keys={p256dh:'a'.repeat(88),auth:'b'.repeat(22)};expect(pushSubscription.safeParse({endpoint:'https://web.push.apple.com/Qfixture',keys}).success).toBeTrue();expect(pushSubscription.safeParse({fcmToken:'fixture-token',platform:'android'}).success).toBeTrue();expect(pushSubscription.safeParse({apnsToken:'fixture-token',platform:'ios'}).success).toBeTrue();for(const endpoint of ['https://127.0.0.1/push','http://fcm.googleapis.com/send','https://evil.invalid','https://fcm.googleapis.com.evil.invalid/send'])expect(pushSubscription.safeParse({endpoint,keys}).success).toBeFalse();});
});
