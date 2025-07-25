// TODO: It would be cool if we could import from the package and not from a relative path
// import '@uni-feedback/ui/style.css'
import '../../../packages/ui/dist/style.css'
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
