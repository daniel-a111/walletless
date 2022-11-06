import './App.css';
import { HashRouter as Router, Route, Routes, useNavigate } from 'react-router-dom'
import { ReactNotifications } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'
import Home from './pages/Home';
import './scss/main.scss';
import Signup from './pages/Signup';
import Intro from './pages/Intro';
import Account from './pages/Account';
import SignTransaction from './pages/SignTransaction';
import Nav from './components/Nav';
import PaymentGateway from './pages/PaymentGateway';
import Signin from './pages/Signin';
import GasFeesBalance from './pages/GasFeesBalance';

function App() {
  return (
    <div className="App">
      <Nav />
        <Router>
          <div className='page-content'>
            <ReactNotifications />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/app/manage" element={<Account />} />
              <Route path="/app/signup" element={<Signup />} />
              <Route path="/app/signin" element={<Signin />} />
              <Route path="/app/gateway" element={<PaymentGateway />} />
              <Route path="/app/" element={<Home />} />
              <Route path="/sign" element={<SignTransaction />} />
              <Route path="/gas-fees" element={<GasFeesBalance />} />
            </Routes>   
          </div>
        </Router>
    </div>
  );
}

export default App;
