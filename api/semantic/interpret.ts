import {createVercelSemanticApp} from '../../server/vercelSemantic.js';

// Module scope preserves the existing cache/coalescing/limits in each warm instance.
// No room server, filesystem storage, listener, or dotenv import is needed here.
export default createVercelSemanticApp();
