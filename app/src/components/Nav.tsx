import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as walletless from '../walletless'

const Nav = () => {

    const [mount, setMount] = useState<boolean>(false);
    const [gasCredit, setGasCredit] = useState<string>("0.0");

    const loadGasFees = async () => {
        setGasCredit(walletless.getState().gasProvider?.balance||'0.0');
        setTimeout(() => {
            loadGasFees(); 
        }, 2000);
    }

    useEffect(() => {
        loadGasFees();        
    }, [mount]);

    return <div className="nav">
        <Link to={'/test-password'}>test password</Link>
        <Link to={'/reset-password'}>reset password</Link>
    </div>;
}
export default Nav;