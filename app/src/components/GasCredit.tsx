import { useEffect, useState } from "react";
import * as walletless from '../walletless'
import * as storage from '../storage'

const GasCredit = () => {

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

    return <div className="gas-credit">
        <span>GAS FEE CREDIT</span><span className="green">${gasCredit}</span>
    </div>;
}
export default GasCredit;