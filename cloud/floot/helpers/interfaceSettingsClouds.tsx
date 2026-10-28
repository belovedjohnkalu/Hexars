import type {CloudNode} from '../endpoints/cloud_POST.schema';
export const tiledUICloudId='account-tiled-ui';
// Reuse the dev's existing Settings cloud and the toggle's permanent identity.
export const interfaceSettingsId='9752ef94-8ecb-4682-81df-16dfe2410616';
export const interfaceSettingsClouds:CloudNode[]=[
 {id:interfaceSettingsId,parentId:'controls',name:'Settings',color:'lavender',system:true,imageUrl:'/_cdn/static/7b10e41f-8468-46ca-aeca-26a0e57c3717-ion-settings-transparent.png'},
];
