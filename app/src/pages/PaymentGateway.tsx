import { createRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { topup } from "../account/Account";
import { copyToClipboard, formatAddress } from "../utils";

const PaymentGateway = () => {

    const [searchParams] = useSearchParams();

    let [address] = useState<string>(searchParams.get('address')||'');
    let [amount] = useState<string>(searchParams.get('amount')||'0.0');
    
    const topupRef = createRef<HTMLInputElement>();
    const onClickTopup = async () => {
        await topup(address, parseFloat(topupRef.current?.value||'0.'));
    }

    return <>
        {/* <AppHeader /> */}
        <div className="app-window">
            payment <input type={'number'} value={amount} ref={topupRef} /><br />
            to <span onClick={copyToClipboard} data-copy={address}>{formatAddress(address)}</span><br />
            <button onClick={onClickTopup}>make payment</button>
        </div>
        <div className="clear"></div>
    </>;
}
export default PaymentGateway;