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

    async function onClickConnectMetaMask() {
        const { ethereum }: any = window;
        try {
            if (!ethereum) {
                window.open('https://metamask.io/', '_blank');
                return;
            }
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            connected(accounts);
        } catch (error) {
            console.error(error);
        }
    }
    const connected = (accounts: any) => {
        console.log(accounts);
    }

    return <>
        <a className="connect-wallet-btn" onClick={onClickConnectMetaMask}>connect wallet</a>
        <div className="app-window">
            payment <input type={'number'} value={amount} ref={topupRef} /><br />
            to <span onClick={copyToClipboard} data-copy={address}>{formatAddress(address)}</span><br />
            <button onClick={onClickTopup}>make payment</button>
        </div>
        <div className="clear"></div>
    </>;
}
export default PaymentGateway;