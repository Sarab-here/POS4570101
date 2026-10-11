import { createRoot } from 'react-dom/client';

import { getAppRoot } from './root';

createRoot(getAppRoot(document)).render(null);
