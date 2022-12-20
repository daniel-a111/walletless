import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../scss/preimage-chain.scss'
const PreimageChain = () => {
    let navigate = useNavigate();

    const onClickTakeSurvey = () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfbVOFWHq4UhzbqIabYL_vclHtoOgK_c-WJd1FUNLmCK5Rd_w/viewform');
    }

    return <div className="preimage-chain">
        <Link className='back-icon' to={'/overview'}></Link>
        <h1>SHA256 Preimage Chain</h1>
        <h2>Authentication process</h2>
        <div>
            <img src={process.env.PUBLIC_URL + '/preimage-chain.svg'} />
        </div>
    </div>;
}
export default PreimageChain;