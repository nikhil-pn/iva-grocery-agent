// Print Iva's brain state: wallet, 0G compute balance, tier, today's spend.
import { brainState } from '../src/brain.mjs';
import { keyUsage } from '../src/zg/account.mjs';
import { totals } from '../src/ledger.mjs';
import { ivaAddress } from '../src/chain.mjs';
const s = await brainState({ fresh: true });
console.log({ iva: ivaAddress, ...s });
console.log('key usage', await keyUsage());
console.log('lifetime', totals());
