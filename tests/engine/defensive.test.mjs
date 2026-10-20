import test from 'node:test';
import {registerEngineTests} from './independent-engine.mjs';
registerEngineTests(test,'engine-3','Defensive');
