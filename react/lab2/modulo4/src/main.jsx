import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom"

// createRoot(document.getElementById('root')).render(
//     <BrowserRouter>
  
//       <StrictMode>
//         <App />
//         <h2>teste 123</h2>
//       </StrictMode>
//    </BrowserRouter>

// )



createRoot(document.getElementById('root')).render(
   <BrowserRouter>
      <App />
   </BrowserRouter>



)



