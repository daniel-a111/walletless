import { BigNumber, ethers } from "ethers";
import { createRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as walletless from "../walletless";
import * as backend from "../backend";
import { loadavg } from "os";
import { Exception } from "sass";
import { utils } from "hash.js";


const Transfer = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(false);
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const coinRef = createRef<HTMLSelectElement>();
    const [balances, setBalances] = useState<any[]>();

    const loadBalances = async () => {
        if (wallet.account?.address) {
            let balances = await walletless.getBalances(wallet.account?.address||'');
            setBalances(balances);
        }
    }
    useEffect(() => {
        loadBalances();
    }, [mount]);

    const getBalance = (symbol: string) => {
        if (balances) {
            let [balance] = balances.filter((b: any) => b.symbol === symbol);
            return balance;
        } else {
            return null;
        }
    }

    const isValidAddress = (address: string) => {
        return true;
    }

    const onClickMakeTransfer = () => {

        let to = toRef.current?.value || '';
        if (!isValidAddress(to)) {
            throw new Error("Not a valid address");
        }
        let amount = amountRef.current?.value||'0.0';
        let valueHex = ethers.utils.parseEther(amount||'0').toHexString();
        let data = '0x';
        // let value = ethers.utils.parseEther(amount||'0.0');
        let coinSymbol = coinRef.current?.value || '';
        let balance = getBalance(coinSymbol);
        if (balance.address) {
            // ERC20
            let dataTo = '000000000000000000000000'+to.substring(2);
            let dataValue = valueHex.substring(2);
            let l = dataValue.length;
            for (let i = 0; i < 64 - l; i++) {
                dataValue = '0'+dataValue;
            }
            const TRANSFER_METHOD_HEX = '0xa9059cbb';
            data = `${TRANSFER_METHOD_HEX}${dataTo}${dataValue}`;
            to = balance.address;
            valueHex = '0x0';
        } else {
            // ETH
            // valueHex = ethers.utils.parseEther(amount).toHexString();
        }

        // console.log({ balance });
        // console.log();
        console.log({to, data, valueHex});
        navigate(`/transfer/sign?to=${to}&value=${valueHex}&data=${data}`)
        // let transact = walletless.transact({
        //     transaction:
        // })
    }

    return <>
        <div>
            <label>Recieptent
                <input ref={toRef} type={'text'} />
            </label>
            <label>Amount
                <input ref={amountRef} type={'number'} />
            </label>
            {
                balances &&
                <select ref={coinRef}>
                {balances.map((coin: any) => {
                    return <option value={coin.symbol}>{coin.name} {coin.symbol}</option>
                })}
            </select>
            }
            <button onClick={onClickMakeTransfer}>Send</button>
        </div>
    </>;
}
export default Transfer;