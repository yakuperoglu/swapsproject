import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import ProfilePage from './components/ProfilePage';
import DiscoverPage from './components/DiscoverPage';
import SuggestionsPage from './components/SuggestionsPage';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import './App.css';

const theme = createTheme();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Header />
                  <main>
                    <Hero />
                    <Features />
                  </main>
                  <Footer />
                </>
              }
            />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/suggestions" element={<SuggestionsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
