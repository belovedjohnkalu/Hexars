import {createContext,useContext,type ReactNode} from 'react';
import {setDarkAppearance} from './useAppearance';
// Preserve the component API; all choices resolve to light.
export type ThemeMode='light'|'dark'|'auto';
export function switchToLightMode(){setDarkAppearance(false);}
export function switchToDarkMode(){setDarkAppearance(false);}
export function switchToAutoMode(){setDarkAppearance(false);}
export function getCurrentThemeMode():ThemeMode{return 'light';}
const value={mode:'light' as ThemeMode,switchToLightMode,switchToDarkMode,switchToAutoMode};
const ThemeModeContext=createContext<typeof value|null>(null);
export function ThemeModeProvider({children}:{children:ReactNode}){return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;}
export function useThemeMode(){const context=useContext(ThemeModeContext);if(!context)throw new Error('useThemeMode must be used within a ThemeModeProvider');return context;}
