import './App.css';
import { HashRouter as Router, Route, Routes } from 'react-router-dom'
import Home from './pages/Home';
import ContactUs from './pages/ContactUs';
import './scss/main.scss';
import Overview from './pages/Overview';
import PreimageChain from './pages/PreimageChain';
import Notice from './pages/Notice';
import Links from './pages/Links';

// window.onbeforeunload = function (e) {
//   e = e || window.event;

//   // For IE and Firefox prior to version 4
//   if (e) {
//       e.returnValue = 'Sure?';
//   }

//   // For Safari
//   return 'Sure?';
// };

function App() {
  return (
    <div className="App">
      <Router>
        <div className='page-content'>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="/notice" element={<Notice />} />
            <Route path="/overview" element={<Overview />} />
            <Route path="/preimage-chain" element={<PreimageChain />} />
            <Route path="/links" element={<Links />} />
          </Routes>   
        </div>
      </Router>
    </div>
  );
}

export default App;
