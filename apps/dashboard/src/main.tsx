// TODO: We need to fix this...
// For some reason the local tailwind config is not
// including the classes from the ui package (even though
// we configured the `content` option in tailwind.config.js).
// By importing both the src and dist styles, we can include
// all the necessary styles, but this is a TERRIBLE workaround.

// import '@uni-feedback/ui/style.css' // <-- Does not work
// import '../../../packages/ui/dist/style.css' // <-- Does not work
// import '../../../packages/ui/src/style.css'
import './index.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
