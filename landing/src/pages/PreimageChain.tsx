import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../scss/preimage-chain.scss'
const PreimageChain = () => {
    let navigate = useNavigate();

    const onClickTakeSurvey = () => {
        window.open('http://bridge-to-earth.com/docs');
    }

    return <div className="preimage-chain">
        <Link className='back-icon' to={'/overview'}></Link>
        <h1>SHA256 Preimage Chain</h1>
        <h2>Authentication process</h2>
        <div>
            <img src={process.env.PUBLIC_URL + '/preimage-chain.svg'} />
        </div>
        <button onClick={onClickTakeSurvey}>Documentation <i className='external-icon' /></button>
    </div>;
}
export default PreimageChain;