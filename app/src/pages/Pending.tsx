import { createRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatAddress } from "../utils";
import * as walletless from "../walletless";
import * as backend from "../backend";
import DonutChart from "../components/DonutChart";
import { walletlessIface } from "../walletless/abis";
import { BigNumber, ethers } from "ethers";
import { sha256 } from "ethers/lib/utils";

const logsToActivity = (activity: any[]) => {
    return activity;
}

const Pending = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(false);
    const [wallet] = useState<walletless.WalletlessState>(walletless.getState());
    const [account, setAccount] = useState<walletless.Account>();
    const [mainBalance, setMainBalance] = useState<walletless.Balance>();
    const [balances, setBalances] = useState<any[]>();
    const [pending, setPending] = useState<any[]>();
    const [isProcessing, setProcessing] = useState<boolean>();
    const [activatePending, setActivatePending] = useState<any>();
    const [isTesting, setTesting] = useState<boolean>(false);
    const [isPassed, setPassed] = useState<boolean>(false);
    const [isAuthenticating, setAuthenticating] = useState<boolean>(false);
    const [proof, setProof] = useState<string>('');

    const passwordRef = createRef<HTMLInputElement>();
    const difficultyRef = createRef<HTMLInputElement>();
    const difficultyUnitRef = createRef<HTMLSelectElement>();

    useEffect(() => {
        loadAccount();
    }, [mount, wallet]);

    useEffect(() => {
        if (account?.balances?.length) {
            setMainBalance(account.balances[0]);
            loadHistory();
        }
    }, [account]);


    const loadAccount = async () => {
        if (wallet.account?.address) {
            let account = await backend.getAccount(wallet.account?.address||'');
            setAccount(account);
            let balances = await walletless.getBalances(wallet.account?.address||'');
            setBalances(balances);
        }
    }

    const enrichWithTransfer = (coinsMapByAddress: any, mainCoin: any, activity: any) => {
        let to = activity.to;
        let coin = coinsMapByAddress[to];
        console.log({coinsMapByAddress})
        if (!coin) {
            console.log({activity});
            if (ethers.utils.parseEther(activity.value).gt(0)) {
                
                let to = activity.to;
                let amount = activity.value;
                let symbol = mainCoin.symbol;
                let logo = mainCoin.logo;

                activity.transfer = {
                    to, amount, symbol, logo
                }
            }
            if (activity.data.startsWith("0xefc54eb7")) {
                activity.description = 'Reset Password';
            }
        } else if (coin && activity.data.startsWith("0xa9059cbb000000000000000000000000")) {
            let to = activity.data.substring("0xa9059cbb000000000000000000000000".length, "0xa9059cbb000000000000000000000000".length+40);
            let amount = ethers.utils.formatEther(BigNumber.from('0x'+activity.data.substring("0xa9059cbb000000000000000000000000".length+40+1)));
            let symbol = coin.symbol;
            let logo = coin.logo;
            activity.transfer = {
                to, amount, symbol, logo
            }
        }
    }

    const loadHistory = async () => {
        let coins = await walletless.getBalances(wallet.account?.address||'');
        let coinsMapByAddress: any = {};
        let mainCoin: any;
        for (let coin of coins) {
            if (coin.address) {
                coinsMapByAddress[coin.address] = coin;
            } else {
                mainCoin = coin;
            }
        }
        for (let i in wallet.account?.pending||[]) {
            let pending = wallet.account?.pending[i];
            pending.priority = i;
            enrichWithTransfer(coinsMapByAddress, mainCoin, pending);
        }
        setPending(wallet.account?.pending);
    }


    const coinSymbolToLogo = (symbol: string) => {
        return balances?.find((c: any) => c.symbol === symbol)?.logo;
    }

    const onClickSignTransaction = async () => {
        setAuthenticating(true);
        setTesting(false);
        let access = await walletless.testPassword({
            transaction: {
                from: wallet?.account?.address || '',
                to: '',
                value: '',
                data: ''
            },
            password: passwordRef?.current?.value || '',
            difficulty: parseInt(difficultyRef.current?.value||'0'),
            difficultyUnit: parseInt(difficultyUnitRef.current?.value||'0')
        });
        setTesting(true);
        setPassed(!!access?.proofProof);
        setAuthenticating(false);

        if (access?.proof) {
            setProof(access.proof);
            let pendings = [];
            let toBeExists = false;
            for (let tx of pending||[]) {

                let to = tx.to;
                let value: string = tx.value;
                let data = tx.data;
                let proof = access.proof;

                to = walletless.normalizeDataArgs(to);
                value = walletless.toNormalized32( ethers.utils.parseEther(value).toHexString());
                data = walletless.normalizeDataArgs(data);
                
                console.log({
                    to, value, data, proof
                });
                let comb = to+value+data+proof;
                let txCert = sha256('0x'+comb);

                let {cert}: any = tx;
                console.log({cert, txCert});
                if (txCert === cert && !toBeExists) {
                    tx.toBe = true;
                    toBeExists = true;
                }
                pendings.push(tx);
            }
            setPending(pendings);
        }
    };

    const onClickTriggerToBe = () => {
        if (wallet.account?.txProcessing) {
            walletless.exposeContinues(wallet.account?.address||'');
        } else {
            walletless.expose(wallet.account?.address||'', proof);
        }
    }
    const onClickContinueExpose = () => {
        walletless.exposeContinues(wallet.account?.address||'');
    }

    return <>
        <div className="app-window walletless-dashboard">
            {
                pending &&
                <>
                    {pending.map((activity: any) => {
                        return <>
                            <div>
                                {activity.toBe && 
                                    <>
                                        TO BE!
                                        <br />
                                        <button onClick={onClickTriggerToBe}>Fire now!</button>
                                        <br />
                                    </>
                                }
                                {formatAddress(activity.nonce)} {activity.event}<br />
                                {activity.transfer &&
                                    <>
                                        {formatAddress(activity.transfer.to)} {activity.transfer.amount} {activity.transfer.symbol} <img src={coinSymbolToLogo(activity.transfer.symbol)} />
                                    </>
                                }
                                {
                                    !activity.transfer &&
                                    <>
                                        Contract {formatAddress(activity.to)}<br />
                                        {
                                            activity.value !== '0.0' &&
                                            <>
                                                Value {activity.value} {mainBalance?.coin.symbol}<br />
                                            </>
                                        }
                                        Data {activity.data}
                                        {
                                            activity.description &&
                                            <>
                                                Method {activity.description}
                                            </>
                                        }
                                    </>
                                }
                            </div><br /><br />
                        </>
                    })}
                </>
            }
        </div>
        <br /><br /><br /><br />
        {
            wallet &&
            <>
                {isTesting &&
                    <>
                        {
                            isPassed &&
                            <>
                                PASSED!
                            </>
                        }
                        {
                            !isPassed &&
                            <>
                                NOT PASSED!
                            </>
                        }
                    </>
                }
                {isProcessing}
                {
                    isProcessing &&
                    <>
                        There is a processing!<br />
                        {activatePending}
                    </>
                }
                {
                    activatePending !== undefined && !activatePending &&
                    <>
                        No pending to execution<br />
                        continues?
                        <button onClick={onClickContinueExpose}>Yes, Continue</button>
                    </>
                }
                {/* {
                    pending && pending?.map((pending: any) => {
                        return <>
                            {pending.to} {pending.value}<br />
                        </>
                    })
                } */}
                {
                    isAuthenticating &&
                    <>
                        Authenticating...
                    </>
                }
                <br />
                <span>sign with password</span>
                <input ref={passwordRef} type={'password'} />
                <span className="input-show-password">
                    <img src={process.env.PUBLIC_URL+'/icons/show-password.svg'} />
                </span>
                <span>Difficulty</span>
                <input ref={difficultyRef} type={'number'} />
                <select ref={difficultyUnitRef}>
                    <option value={1}>Milliseconds</option>
                    <option selected={true} value={1000}>Seconds</option>
                    <option value={60*1000}>Minutes</option>
                    <option value={60*60*1000}>Hours</option>
                    <option value={24*60*60*1000}>Days</option>
                </select>
                <div>
                    <button onClick={onClickSignTransaction}>Send</button>
                </div>
            </>
        }
        <div className="clear"></div>
    </>;
}
export default Pending;