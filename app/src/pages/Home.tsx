import { createRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { clearAccount, getAccountAddress, getBalance, getFeesAccountBalance, getGasFeesBalance, testPassword, transactExpose, transactPreset } from "../account/Account";
import { topupData } from "../contracts";
import { loadAccountAddress, loadExposeTxHash, loadPresetTxHash, storeExposeTxHash, storePresetTxHash } from "../account/storage";
import * as Backend from "../backend";
import config from "../config";

let pass: string|undefined;
const Home = () => {
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();
    let clear = searchParams.get("clear");

    const [mount] = useState<boolean>(false);
    const [accountAddress, setAccountAddress] = useState<string|undefined>(loadAccountAddress());
    const [balance, setBalance] = useState<number>(0);
    const [gasFeesBalance, setGasFeesBalance] = useState<number>(0);
    useEffect(() => {
        (async () => {
            if (clear) {
                clearAccount();
            }
            setAccountAddress(loadAccountAddress());
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


    const [presetTxHash, setPresetTxHash] = useState<string|undefined>(loadPresetTxHash());
    const [exposeTxHash, setExposeTxHash] = useState<string|undefined>(loadExposeTxHash());
    useEffect(() => {
        storePresetTxHash(presetTxHash||null);
    }, [presetTxHash]);
    useEffect(() => {
        storeExposeTxHash(exposeTxHash||null);
    }, [exposeTxHash]);
    const TRASACT_STEP_1_INIT = 'TRASACT_STEP_1_INIT';
    const TRASACT_STEP_2_PRESET = 'TRASACT_STEP_2_PRESET';
    const TRASACT_STEP_3_PRESET_DONE = 'TRASACT_STEP_3_PRESET_DONE';
    const TRASACT_STEP_3_1_PRESET_FAILED = 'TRASACT_STEP_3_1_PRESET_FAILED';
    const TRASACT_STEP_4_EXPOSE = 'TRASACT_STEP_4_EXPOSE';
    const TRASACT_STEP_5_EXPOSE_DONE = 'TRASACT_STEP_5_EXPOSE_DONE';
    const TRASACT_STEP_5_1_EXPOSE_FAILED = 'TRASACT_STEP_5_1_EXPOSE_FAILED';

    let sv: string|undefined;
    if (exposeTxHash) {
        sv = TRASACT_STEP_4_EXPOSE;
    } else if (presetTxHash) {
        sv = TRASACT_STEP_3_PRESET_DONE;
    }
    const [step, setStep] = useState<string|undefined>(sv);

    useEffect(() => {
        (async () => {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 5000);
            })
            if (step === TRASACT_STEP_1_INIT) {
                let { transaction }: any = await transactPreset(to, amount, data, authRef.current?.value||'');
                setPresetTxHash(transaction.hash);
                setStep(TRASACT_STEP_2_PRESET)
            } else if (step === TRASACT_STEP_2_PRESET) {
                let { receipt }: any = await Backend.receipt(presetTxHash||'');

                while (!receipt) {
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(true);
                        }, 1000);
                    })
                    let { receipt: r }: any = await Backend.receipt(presetTxHash||'');
                    receipt = r;
                }
                if (receipt.status === 1) {
                    setPresetTxHash(undefined);
                    setStep(TRASACT_STEP_3_PRESET_DONE);
                } else {
                    // TODO failed
                    setStep(TRASACT_STEP_3_1_PRESET_FAILED);
                }

            } else if (step === TRASACT_STEP_3_PRESET_DONE) {
                let { transaction }: any = await transactExpose(pass||'');
                setStep(TRASACT_STEP_4_EXPOSE);
                setExposeTxHash(transaction.hash);
            } else if (step === TRASACT_STEP_4_EXPOSE) {
                let { receipt }: any = await Backend.receipt(exposeTxHash||'');
                if (receipt) {
                    if (receipt.status === 1) {
                        setExposeTxHash(undefined);
                        setStep(TRASACT_STEP_5_EXPOSE_DONE);
                    } else {
                        // TODO failed
                        setStep(TRASACT_STEP_5_1_EXPOSE_FAILED);
                    }
                }
            }
        })();
    }, [step]);

    const onClickAuth = async () => {
        pass = authRef.current?.value||'';
        setStep(TRASACT_STEP_1_INIT);
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
                                            To <input type={'text'} ref={toRef} defaultValue={'0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'} /><br />
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
                                            {presetTxHash &&
                                                <>
                                                    <div>
                                                        {step === TRASACT_STEP_3_1_PRESET_FAILED &&
                                                            <span>failed</span>
                                                        }
                                                        step 0/2 <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', presetTxHash)}`}>{formatAddress(presetTxHash)}</a>...
                                                    </div>
                                                </>
                                            }
                                            {exposeTxHash &&
                                                <>
                                                    <div>
                                                        step 1/2 <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', exposeTxHash)}`}>{formatAddress(exposeTxHash)}</a>...
                                                    </div>
                                                </>
                                            }
                                            {
                                                step === TRASACT_STEP_5_EXPOSE_DONE &&
                                                <>done.</>
                                            }
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