import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import './index.css';
import Root from './pages/root';
import Tunnel from './pages/tunnel';
import Home from './pages/home';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <div> Error Page </div>,
    children: [
      {
        path: "/",
        element: <Home />
      },
      {
        path: "tunnel/:tunnelCode",
        element: <Tunnel />
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
