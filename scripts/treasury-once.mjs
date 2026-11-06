// Run one treasury tick by hand (deposit earnings into 0G compute / pay dividend).
import { treasuryTick } from '../src/treasury.mjs';
console.log(await treasuryTick('manual') || 'nothing to do');
