import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'

import 'themes/types'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <BrowserRouter basename="/">
    <App />
      </BrowserRouter>
  </StrictMode>
)
