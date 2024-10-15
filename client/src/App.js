import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './index.css';
import Layout from './components/Layout';
import EnhancedLandingPage from './components/EnhancedLandingPage';
import AuthPage from './components/AuthPage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<EnhancedLandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
