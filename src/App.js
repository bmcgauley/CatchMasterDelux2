import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import EnhancedLandingPage from './components/EnhancedLandingPage';
import MainApp from './components/MainApp';
import Games from './pages/Games';
import Pokedex from './pages/Pokedex';
import Progress from './pages/Progress';
import Dashboard from './pages/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <div className="App">
        <Switch>
          <Route exact path="/">
            {isLoggedIn ? <MainApp /> : <EnhancedLandingPage />}
          </Route>
          <Route path="/games" component={Games} />
          <Route path="/pokedex" component={Pokedex} />
          <Route path="/progress" component={Progress} />
          <Route path="/dashboard" component={Dashboard} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
