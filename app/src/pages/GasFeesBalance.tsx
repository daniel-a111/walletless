import { createRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { getAccount, getAccountAddress, getFeesAccountAddress, getFeesAccountBalance, getGasFeesBalance, testPassword } from "../account/Account";

const GasFeesBalance = () => {
    let navigate = useNavigate();
    const [mount] = useState<boolean>(false);
    const [accountAddress] = useState<string|undefined>(getAccountAddress());
    const [feesAccount, setFeesAccount] = useState<string|undefined>();
    const [gasFeesBalance, setGasFeesBalance] = useState<number>(0.0);
    useEffect(() => {
        (async () => {

            const update = async () => {
                let feesAccount = await getFeesAccountAddress();
                setFeesAccount(feesAccount);
                setGasFeesBalance(parseFloat(await getFeesAccountBalance()));
                if (accountAddress && !feesAccount) {
                    setTimeout(update, 500);
                }
            }
            update();
        })();
    }, [mount]);

    const [auth, setAuth] = useState<boolean>(false);

    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const dataRef = createRef<HTMLTextAreaElement>();
    const authRef = createRef<HTMLInputElement>();

    const [to, setTo] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [data, setData] = useState<string>('');

    const onClickSubmit = () => {
        setTo(toRef.current?.value||'');
        setAmount(amountRef.current?.value||'0.');
        setData(dataRef.current?.value||'');
        setAuth(true);
    }

    const onClickAuth = async () => {
        // await transact(to, amount, data, authRef.current?.value||'');
    }

    const topupRef = createRef<HTMLInputElement>();

    const [paymentGateway, setPaymentGateway] = useState<string>();
    const onClickCreatePaymentGateway = async () => {
        setPaymentGateway(`${process.env.PUBLIC_URL}/#/app/gateway?address=${feesAccount}&amount=${topupRef.current?.value||'0.0'}`);
    }

    const ACTION_PAYMENT_GATEWAY = 1;
    const ACTION_TRANSFER = 2;
    const ACTION_OTHER = 3;
    const [action, setAction] = useState<number|null>();

    const [isToContract, setToContract] = useState<boolean>(false);
    const isToContractRef = createRef<HTMLInputElement>();

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
            <Link style={{ float: 'left', display: 'inline-block', marginTop: '-60px' }} to={'/app'}>back</Link>
            {
                feesAccount &&
                <>
                    gas fees deposit account<br /><span style={{ fontSize: '24px', cursor: 'pointer' }}
                        data-copy={feesAccount}
                        onClick={copyToClipboard}>{formatAddress(feesAccount)}</span>
                    <div style={{ marginTop: '60px' }}>
                        available gas fees: {formatBalancePrimitive(gasFeesBalance)}$
                    </div>
                    <div className="take-action-box">
                        <>
                            {!action &&
                                <>
                                    <span className="main-menu-title">What do you like to do?</span><br />
                                    <span className="main-menu-item"
                                        onClick={() => setAction(ACTION_PAYMENT_GATEWAY)}>deposit with credit card</span>
                                </>
                            }
                            {
                                action &&
                                <>
                                    <span className="left" onClick={() => setAction(null)}>back</span>
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
                                    <br />
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
                                            Address <input disabled={true} value={feesAccount} type={'text'} />
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
                !feesAccount &&
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
export default GasFeesBalance;