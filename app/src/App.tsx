import './App.css';
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './pages/Home';
import './scss/main.scss';
import signup from './components/signup';
import Account from './pages/Account';
import GasCredit from './components/GasCredit';
import Transfer from './pages/Transfer';
import Sign from './pages/transact/Sign';
import Receive from './pages/Receive';
import ReceiveSign from './pages/ReceiveSign';
import TestPassword from './pages/TestPassword';
import SetPassword from './pages/SetPassword';

function App() {
  return (
    <div className="App">
      <Router>
        <div className='page-content'>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app/manage" element={<Account />} />
            <Route path="/app/signup/step1" element={<signup.Step1 />} />
            <Route path="/app/signup/step2" element={<signup.Step2 />} />
            <Route path="/app/signup/step3" element={<signup.Step3 />} />
            <Route path="/app/" element={<Home />} />
            <Route path="/recieve" element={<Receive />} />
            <Route path="/recieve/sign" element={<ReceiveSign />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfer/sign" element={<Sign />} />
            <Route path="/test-password" element={<TestPassword />} />
            <Route path="/set-password" element={<SetPassword />} />
          </Routes>   
        </div>
      </Router>
      <GasCredit />
    </div>
  );
}

export default App;
