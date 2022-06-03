import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import 'themes/types'
import './index.css'
import { AuthProvider } from 'contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <AuthProvider>
            <BrowserRouter basename="/">
                <App/>
            </BrowserRouter>
        </AuthProvider>
    </StrictMode>
)
