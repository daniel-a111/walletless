import './App.css';
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './pages/Home';
import './scss/main.scss';
import signup from './components/signup';
import Account from './pages/Account';
import Transfer from './pages/Transfer';
import Sign from './pages/transact/Sign';
import Receive from './pages/Receive';
import ReceiveSign from './pages/ReceiveSign';
import TestPassword from './pages/TestPassword';
import SetPassword from './pages/SetPassword';
import Nav from './components/Nav';
import Login from './pages/Login';
import Footer from './components/Footer';
import Activities from './pages/Activities';
import Pending from './pages/Pending';

function App() {
  return (
    <div className="App">
      <Router>
        <div className='page-content'>
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/app/manage" element={<Account />} />
            <Route path="/app/signup/step1" element={<signup.Step1 />} />
            <Route path="/app/signup/step2" element={<signup.Step2 />} />
            <Route path="/app/signup/step3" element={<signup.Step3 />} />
            <Route path="/app/login" element={<Login />} />
            <Route path="/app/" element={<Home />} />
            <Route path="/recieve" element={<Receive />} />
            <Route path="/recieve/sign" element={<ReceiveSign />} />
            <Route path="/transfer" element={<Transfer />} />
            <Route path="/transfer/sign" element={<Sign />} />
            <Route path="/test-password" element={<TestPassword />} />
            <Route path="/reset-password" element={<SetPassword />} />
            <Route path="/activities" element={<Activities />} />
            <Route path="/pending" element={<Pending />} />
          </Routes>   
        </div>
      </Router>
      <Footer />
    </div>
  );
}

export default App;
