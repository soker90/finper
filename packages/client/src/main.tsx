import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import 'themes/types'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter basename="/">
    <App />
      </BrowserRouter>
  </StrictMode>
)
