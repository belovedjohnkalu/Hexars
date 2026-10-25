// View orientation only; changing the viewpoint never changes turn ownership.
export function gameFacing(variant:string,player:number,viewOffset=0):boolean|number {
 if(variant==='wellisch')return -120*((player+viewOffset)%3);
 // The publisher's unrotated Kruzno setup puts Black at the bottom left.
 // Keep that reference view on either turn; an explicit flip still rotates it.
 if(variant==='kruzno')return viewOffset%2===1;
 return (player+viewOffset)%2===1;
}
