import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { DataProvider } from './state/DataContext';

import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

const theme = createTheme({});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <DataProvider>
                    <App />
                </DataProvider>
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>
);
