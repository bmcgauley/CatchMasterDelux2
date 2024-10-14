import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import EnhancedLandingPage from './components/EnhancedLandingPage';
import MainApp from './components/MainApp';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={isLoggedIn ? <MainApp /> : <EnhancedLandingPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;