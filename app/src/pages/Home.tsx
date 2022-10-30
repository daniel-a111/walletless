import { createRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { getAccountAddress, getBalance, getFeesAccountAddress, getFeesAccountBalance, getGasFeesBalance, testPassword, transact } from "../account/Account";
import { topupData } from "../contracts";

const Home = () => {
    let navigate = useNavigate();
    const [mount] = useState<boolean>(false);
    const [accountAddress] = useState<string|undefined>(getAccountAddress());
    const [feesAccountAddress, setFeesAccountAddress] = useState<string|undefined>();
    const [feesAccountBalance, setFeesAccountBalance] = useState<number|undefined>();
    const [balance, setBalance] = useState<number>(0);
    const [gasFeesBalance, setGasFeesBalance] = useState<number>(0);
    useEffect(() => {
        (async () => {
            setFeesAccountAddress(await getFeesAccountAddress());
            setFeesAccountBalance(parseFloat(await getFeesAccountBalance()));
            setBalance(await getBalance());
            setGasFeesBalance(parseFloat(await getFeesAccountBalance()));
        })();
        setInterval(async () => {
            setBalance(await getBalance());
            setGasFeesBalance(await getGasFeesBalance());
        }, 1000);
    }, [mount]);

    const [auth, setAuth] = useState<boolean>(false);

    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const dataRef = createRef<HTMLTextAreaElement>();
    const authRef = createRef<HTMLInputElement>();

    const [to, setTo] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [data, setData] = useState<string>('0x');

    const onClickSubmit = async () => {
        setTo(toRef.current?.value||'');
        setAmount(amountRef.current?.value||'0.');
        if (isToWalletLess) {
            setData( await topupData(toRef.current?.value||''));
        } else {
            setData(dataRef.current?.value||'0x');
        }
        setAuth(true);
    }

    const onClickAuth = async () => {
        await transact(to, amount, data, authRef.current?.value||'');
    }

    const topupRef = createRef<HTMLInputElement>();

    const [paymentGateway, setPaymentGateway] = useState<string>();
    const onClickCreatePaymentGateway = async () => {
        setPaymentGateway(`${process.env.PUBLIC_URL}/#/app/gateway?address=${accountAddress}&amount=${topupRef.current?.value||'0.0'}`);
    }

    const ACTION_PAYMENT_GATEWAY = 1;
    const ACTION_TRANSFER = 2;
    const ACTION_OTHER = 3;
    const [action, setAction] = useState<number|null>();

    const [isToContract, setToContract] = useState<boolean>(false);
    const isToContractRef = createRef<HTMLInputElement>();
    const [isToWalletLess, setToWalletless] = useState<boolean>(false);
    const isToWalletLesRef = createRef<HTMLInputElement>();

    const [subAction, setSubAction] = useState<number|null>();
    const SUB_ACTION_TEST_PASSWORD = 4;

    const [testPassPassed, setTestPassPassed] = useState<boolean|undefined>();
    const testPassRef = createRef<HTMLInputElement>();
    const onClickTestPassword = async () => {
        setTestPassPassed(await testPassword(testPassRef.current?.value||''));
    }

    return <>
        {/* <AppHeader /> */}
        <div className="app-window">
            {
                accountAddress &&
                <>
                    you are connected to<br /><span style={{ fontSize: '24px', cursor: 'pointer' }}
                        data-copy={accountAddress}
                        onClick={copyToClipboard}>{formatAddress(accountAddress)}</span>
                    <div style={{ marginTop: '60px' }}>
                        Total Balance<br /><span style={{ fontSize: '28px' }}>{formatBalancePrimitive(balance)}$</span>
                    </div>
                    <div onClick={() => navigate(`/gas-fees`)} style={{ marginTop: '60px' }}>
                        available gas fees: {formatBalancePrimitive(gasFeesBalance)}$
                    </div>
                    <div className="take-action-box">
                        <>
                            {!action &&
                                <>
                                    <span className="main-menu-title">What do you like to do?</span><br />
                                    <span className="main-menu-item"
                                        onClick={() => setAction(ACTION_PAYMENT_GATEWAY)}>create payment gateway</span>
                                    <span className="main-menu-item"
                                        onClick={() => setAction(ACTION_TRANSFER)}
                                    >transfer</span>
                                    <span
                                        onClick={() => setAction(ACTION_OTHER)}
                                    className="main-menu-item">more actions</span>
                                </>
                            }
                            {
                                action &&
                                <>
                                    {
                                        !subAction &&
                                        <span className="left" onClick={() => setAction(null)}>back</span>
                                    }
                                    {
                                        subAction &&
                                        <span className="left" onClick={() => setSubAction(null)}>back</span>
                                    }
                                    <br />
                                </>
                            }
                            {
                                action === ACTION_TRANSFER &&
                                <div>
                                    {
                                        !auth &&
                                        <>
                                            To <input type={'text'} ref={toRef} /><br />
                                            Amount <input type={'number'} ref={amountRef} /><br />
                                            is wallet-less? <input ref={isToWalletLesRef} onChange={
                                                () => setToWalletless(!!(isToWalletLesRef?.current?.checked)) } type={'checkbox'} /><br />
                                            with data? <input ref={isToContractRef} onChange={
                                                () => setToContract(!!(isToContractRef?.current?.checked)) } type={'checkbox'} /><br />
                                            {
                                                isToContract &&
                                                <>
                                                    Data <textarea ref={dataRef}></textarea><br />
                                                </>
                                            }
                                            <button onClick={onClickSubmit}>submit</button>
                                        </>
                                    }
                                    {
                                        auth &&
                                        <>
                                            Password <input type={'password'} ref={authRef} /><br />
                                            <button onClick={onClickAuth}>auth</button>
                                        </>
                                    }
                                </div>
                            }
                            {
                                action === ACTION_PAYMENT_GATEWAY &&
                                <>
                                    topup <input type={'number'} ref={topupRef} />
                                    <button onClick={onClickCreatePaymentGateway}>create payment gateway</button>

                                    {
                                        paymentGateway &&
                                        <>
                                            <br /><br />
                                            <input type={'text'} value={paymentGateway} />
                                            <a href={paymentGateway}>go to</a>
                                        </>
                                    }
                                </>
                            }
                            {
                                action === ACTION_OTHER &&
                                <>
                                    {
                                        !subAction &&
                                        <>
                                            <span
                                                onClick={() => navigate(`/app/signin`)}
                                                className="main-menu-item">Load account</span>
                                            <span className="main-menu-item"
                                                onClick={() => navigate(`/app/signup`)}
                                            >Create account</span>
                                            <span className="main-menu-item"
                                                onClick={() => navigate(`/app/manage`)}
                                            >account settings</span>
                                            <span className="main-menu-item"
                                                onClick={() => setSubAction(SUB_ACTION_TEST_PASSWORD)}
                                            >Test password</span>
                                        </>
                                    }
                                    {
                                        subAction === SUB_ACTION_TEST_PASSWORD &&
                                        <>
                                            Address <input disabled={true} value={accountAddress} type={'text'} />
                                            Password <input type={'password'} onKeyUp={() => setTestPassPassed(undefined)} ref={testPassRef} />
                                            <button onClick={onClickTestPassword}>test</button>
                                            {
                                                testPassPassed === true &&
                                                <>
                                                    Passed!!
                                                </>
                                            }
                                            {
                                                testPassPassed === false &&
                                                <>
                                                    Wrong password :(
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                        </>
                    </div>
                </>
            }
            {
                !accountAddress &&
                <>
                    <span
                        onClick={() => navigate(`/app/signin`)}
                        className="main-menu-item">Sign in account</span>
                    <span className="main-menu-item"
                        onClick={() => navigate(`/app/signup`)}
                    >Create new account</span>
                </>
            }
        </div>
        <div className="clear"></div>
    </>;
}
export default Home;