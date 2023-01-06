import { ethers } from "ethers";
import { createRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const Receive = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(false);
    // const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const coinRef = createRef<HTMLSelectElement>();

    // const loadGasFees = async () => {
    //     let wallet = walletless.getState()
    //     setWallet(wallet);
    //     if (wallet.account?.cert !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
    //         navigate('/app/manage');
    //     } else if (!wallet.account) {
    //         navigate('/app/signup');
    //     }
    //     setTimeout(() => {
    //         loadGasFees(); 
    //     }, 300);
    // }
    // useEffect(() => {
    //     loadGasFees();
    // }, [mount]);

    const onClickMakeTransfer = () => {
        let to = toRef.current?.value;
        let amount = amountRef.current?.value;
        // let value = ethers.utils.parseEther(amount||'0.0');
        let data = '0x42f6487a';
        
        navigate(`/recieve/sign?to=${to}&value=${amount}&data=${data}`)
        // let transact = walletless.transact({
        //     transaction:
        // })
    }

    return <>
        <div>
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
export default Receive;