import {nicknameSchema,isNicknameTaken} from './nickname';
import {schema} from '../endpoints/auth/register_with_password_POST.schema';
describe('Public nicknames',()=>{
 it('recognizes nickname collisions from both Postgres drivers without treating other unique constraints as nicknames',()=>{expect(isNicknameTaken({code:'23505',constraint_name:'users_nickname_unique_idx'})).toBeTrue();expect(isNicknameTaken({code:'23505',constraint:'users_nickname_unique_idx'})).toBeTrue();expect(isNicknameTaken({code:'23505',constraint_name:'users_email_key'})).toBeFalse();});
 it('accepts a trimmed nickname without changing the email identity',()=>{const result=schema.parse({email:' A@EXAMPLE.COM ',password:'long password',displayName:'  North Star  '});expect(result.displayName).toBe('North Star');expect(result.email).toBe('a@example.com');});
 it('allows registration without an optional nickname and rejects publishing an email as one',()=>{expect(schema.safeParse({email:'a@example.com',password:'long password'}).success).toBeTrue();expect(nicknameSchema.safeParse('a@example.com').success).toBeFalse();expect(nicknameSchema.safeParse('x'.repeat(41)).success).toBeFalse();});
});
