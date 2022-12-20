import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../scss/home.scss'
const Home = () => {
    let navigate = useNavigate();

    const onClickTakeSurvey = () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfbVOFWHq4UhzbqIabYL_vclHtoOgK_c-WJd1FUNLmCK5Rd_w/viewform');
    }

    return <div className="home">
        <div className="top">
            <span>COMING SOON</span>
        </div>
        <Link to={'/notice'} className='receive-updates'><i className='bell-icon' /> RECEIVE UPDATES</Link>
        <div className='clear' />
        <h1>Walletless</h1>
        <h2>Decentralized & simplified</h2>
        <div className='clear' />
        <p className='choose-description'>Choose your own password. Hold your own assets. 
        <Link to={'/overview'} className='arrow-blue-big' /></p>
        <button 
            onClick={onClickTakeSurvey}
            className='button'><i className='clock-icon-white' />2-minute Survey</button>
        <Link to='contact-us' className='contact-us-link'>Contact us</Link>
    </div>;
}
export default Home;