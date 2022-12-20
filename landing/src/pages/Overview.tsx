import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../scss/overview.scss'
const Overview = () => {
    let navigate = useNavigate();

    const onClickTakeSurvey = () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfbVOFWHq4UhzbqIabYL_vclHtoOgK_c-WJd1FUNLmCK5Rd_w/viewform');
    }

    return <div className="overview">
        <div className='nav'>
            <Link className='back-icon' to={'/'}></Link>
            <span className='logo'>Walletless</span>
            <Link to={'/contact-us'} className='chat-icon' />
        </div>
        <h1>No need to hold onto your private keys any longer.</h1>
        <p>
            We've discovered a way to enable fully encrypted <b>user-chosen passwords</b> on decentralized networks.
            <br /><br />
How?
<br /><br />
Using a SHA256 preimage chainto authenticate transactions.
            <Link className='learn-more-link' to={'/preimage-chain'}>Learn more {'>'}</Link>
        </p>
        <div className='our-platform-header'>
            <i className='platform-icon' />
            <h1>Our platform</h1>
            <p>Interface, Gas Fees & Security</p>
        </div>
        <h1>Interface</h1>
        <div className='interface-description'>
            <h2>Account setup</h2>
            <div className='screenshots screenshots-1'></div>
            <h2>Dashboard, Send, Receive</h2>
            <div className='screenshots screenshots-2'></div>
        </div>
        <div className='gas-fees'>
            <h2>Gas Fees</h2>
            <h3>Innovated</h3>
            <p>A linked Gas Credit account is easily topped-up within the app.
This feature is key to enabling the replacement of the private key.
Additionally, this prevents Gas Exhausting Attacks.</p>
        </div>
        <div className='security'>
            <h2>Security</h2>
            <h3>Guessing Attacks</h3>
            <p>User can define the difficulty level in performing Guessing Attacks. The parameter affects the time taken to perform authentication.
A Guessing Attacker would not be able to effectively automate an attack without this information.</p>
        </div>
    </div>;
}
export default Overview;