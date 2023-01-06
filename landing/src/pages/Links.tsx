import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../scss/home.scss'
const Links = () => {
    let navigate = useNavigate();

    const onClickTakeSurvey = () => {
        window.open('https://docs.google.com/forms/d/e/1FAIpQLSfbVOFWHq4UhzbqIabYL_vclHtoOgK_c-WJd1FUNLmCK5Rd_w/viewform');
    }

    return <div className="links">

        <div style={{width: '400px', margin: '160px auto 0',}} >
            <img src={process.env.PUBLIC_URL + '/qrcode.svg'} />
        </div>
    </div>;
}
export default Links;