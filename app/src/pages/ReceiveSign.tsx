import { ethers } from "ethers";
import { createRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { topup } from "../contracts";
import * as walletless from "../walletless";

const coins = [{
    symbol: 'BTC',
    name: 'Bitcoin',
    logo: process.env.PUBLIC_URL+'/icons/btc.svg',
    address: '',
    balance: '2.43',
    usdValue: '30k'
}, {
    symbol: 'ETH',
    name: 'Ether',
    logo: process.env.PUBLIC_URL+'/icons/eth.svg',
    address: '',
    balance: '2.43',
    usdValue: '30k',
    default: true
}, {
    symbol: 'DAI',
    name: 'Dai',
    logo: process.env.PUBLIC_URL+'/icons/dai.svg',
    address: '',
    balance: '2.43',
    usdValue: '30k'
}, {
    symbol: 'USDT',
    name: 'Tether',
    logo: process.env.PUBLIC_URL+'/icons/usdt.svg',
    address: '',
    balance: '2.43',
    usdValue: '30k'
}]

const ReceiveSign = () => {
    let navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const [to] = useState<string>(searchParams.get("to")||'');
    const [value] = useState<string>(searchParams.get("value")||'0.0');
    const [data] = useState<string>(searchParams.get("data")||'');

    const [mount] = useState<boolean>(false);
    // const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const coinRef = createRef<HTMLSelectElement>();


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

    const onClickMakeTransfer = async () => {
        console.log();
        await topup(walletless.getState().account?.address||'', value);
    }

    return <>
        <div>
            <div>
                <button onClick={onClickConnectMetaMask}>Connect</button>
            </div>
            <label>Recieptent
                <input ref={toRef} type={'text'} value={walletless.getState().account?.address} />
            </label>
            <label>Amount
                <input ref={amountRef} type={'number'} />
            </label>
            <select>
                {coins.map((coin: any) => {
                    return <option value={coin.symbol}>{coin.name} {coin.symbol}</option>
                })}
            </select>
            <button onClick={onClickMakeTransfer}>Send</button>
        </div>
    </>;
}
export default ReceiveSign;