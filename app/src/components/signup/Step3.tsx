import { createRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import { deployAccount, FeesAccount, getAccount, getAccountAddress, getOrCreateFeesAccount, initAccount } from "../account/Account";
// import { loadInitTxHash, loadSignupTxHash, storeAccountAddress, storeInitTxHash, storeSignupTxHash } from "../account/storage";
import * as Backend from "../../backend";
// import ExperimentWarning from "../../components/ExperimentWarning";
import config from "../../config";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../../utils";
import * as walletless from '../../walletless';

const STEP_1_GEN_FEES_ACCOUNT = 'STEP_1_GEN_FEES_ACCOUNT';
const STEP_2_WAITING_DEPLOY = 'STEP_2_WAITING_DEPLOY';
const STEP_3_PROCESSING_DEPLOY = 'STEP_3_PROCESSING_DEPLOY';
const STEP_4_WAITING_PASS = 'STEP_4_WAITING_PASS';
const STEP_5_WAITING_RE_PASS = 'STEP_5_WAITING_RE_PASS';
const STEP_5_WAITING_DIFFICULTY = 'STEP_5_WAITING_DIFFICULTY';
const STEP_6_WAITING_INIT = 'STEP_6_WAITING_INIT';
const STEP_7_PROCESSING_INIT = 'STEP_7_PROCESSING_INIT';
const STEP_8_DONE = 'STEP_8_DONE';

const Step3 = () => {

    const passRef = createRef<HTMLInputElement>();
    const rePassRef = createRef<HTMLInputElement>();
    const difficultyUnitRef = createRef<HTMLSelectElement>();
    const difficultyRef = createRef<HTMLInputElement>();

    const [accountAddress, setAccountAddress] = useState<string|undefined>();
    const [signupTxHash, setSignupTxHash] = useState<string|undefined>();
    const [initTxHash, setInitTxHash] = useState<string|undefined>();
    const [symbol] = useState<string>('MATIC');

    const [feesAccountAddress, setFeesAccountAddress] = useState<string|undefined>();
    const [feesAccountBalance, setFeesAccountBalance] = useState<number|undefined>();

    const [mount] = useState<boolean>(true);
    const [step, setStep] = useState<string>(STEP_1_GEN_FEES_ACCOUNT);
    const [pass, setPass] = useState<string>();
    const [difficulty, setDifficulty] = useState<number>();
    const [difficultyUnit, setDifficultyUnit] = useState<number>();

    const loadFeesAccount = async () => {
        try {
            // let feesAccount = await getOrCreateFeesAccount();
            // setFeesAccountAddress(feesAccount.address);
            // setFeesAccountBalance(parseFloat(feesAccount.balance));
        } catch (e: any) {}
        setTimeout(loadFeesAccount, 3000);
    }
    useEffect(() => {
        loadFeesAccount();
    }, [mount]);

    const [isLoadingAccount, setLoadingAccount] = useState<boolean>(false);
    useEffect(() => {
        (async () => {
            setLoadingAccount(true);
            // let account = await getAccount();
            // setLoadingAccount(false);
            // let isFirstStep = false;
            // if (account?.isActive) {
            //     setStep(STEP_8_DONE);
            // } else if (accountAddress && initTxHash) {
            //     setStep(STEP_7_PROCESSING_INIT);
            // } else if (accountAddress) {
            //     setStep(STEP_4_WAITING_PASS);
            // } else if (signupTxHash) {
            //     setStep(STEP_3_PROCESSING_DEPLOY);
            // } else if (feesAccountAddress) {
            //     setStep(STEP_2_WAITING_DEPLOY);
            // } else {
            //     setStep(STEP_1_GEN_FEES_ACCOUNT);
            //     isFirstStep = true;
            // }
            // let feesAccount = await getOrCreateFeesAccount();
            // setFeesAccountAddress(feesAccount.address);
            // setFeesAccountBalance(parseFloat(feesAccount.balance));
            // if (isFirstStep) {
            //     setStep(STEP_2_WAITING_DEPLOY);
            // }
        })();
    }, [feesAccountAddress, accountAddress]);

    useEffect(() => {
        if (step === STEP_3_PROCESSING_DEPLOY) {
            handleSignupTxHash();
        } else if (step === STEP_7_PROCESSING_INIT) {
            handleInitTxHash();
        }
    }, [step]);

    const dataToAddress = (data: string) => {
        return '0x'+data.substring(26);
    }

    const handleSignupTxHash = async () => {
        if (!signupTxHash) {
            setTimeout(handleSignupTxHash, 1000);
            return;
        }
        try {
            let { done, success, account } = await Backend.signupTxStatus(signupTxHash||'');
            if (account?.address) {
                // storeAccountAddress(account.address);
                // setAccountAddress(account.address);
                // storeSignupTxHash(null);
                // setStep(STEP_4_WAITING_PASS);
            }
            if (!done) {
                setTimeout(handleSignupTxHash, 1000);
            } else if (!success) {
                setStep(STEP_2_WAITING_DEPLOY);
            }
        } catch(e) {
            setTimeout(handleSignupTxHash, 1000);
        }
    }

    const handleInitTxHash = async () => {
        if (!initTxHash) return;
        let { done, success, account }: any = await Backend.initTxStatus(initTxHash||'');
        if (success) {
            // storeInitTxHash(null);
            // setStep(STEP_8_DONE);
        }
    }
    useEffect(() => {
        if (step === STEP_3_PROCESSING_DEPLOY) {
            handleSignupTxHash();
        } else if (step === STEP_7_PROCESSING_INIT) {
            handleInitTxHash();
        }
    }, [step]);

    const [message, setMessage] = useState<string>();
    const [errorMessage, setErrorMessage] = useState<string|undefined>();
    const [isDeployInProcess, setDeployInProcess] = useState<boolean>(false);
    const onStepDeployDone = async () => {
        try {
            // setDeployInProcess(true);
            // await deployAccount();
            // setStep(STEP_3_PROCESSING_DEPLOY);
            // setSignupTxHash(loadSignupTxHash());
            // setDeployInProcess(false);
        } catch (error: any) {
            setDeployInProcess(false);
            setErrorMessage(error.message);
            setStep(STEP_2_WAITING_DEPLOY);
        }
    }

    const onStepPassDone = () => {
        console.log({test: '1'})
        if (passRef.current?.value) {
            setPass(passRef.current?.value);
            setStep(STEP_5_WAITING_RE_PASS);
        }
    }

    const [isGeneratingAuthentication, setGeneratingAuthentication] = useState<boolean>(false);
    const onStepPassReDone = async () => {
        console.log('23423');
        if (pass && pass === rePassRef.current?.value) {
            setStep(STEP_5_WAITING_DIFFICULTY)
            // try {
            //     setGeneratingAuthentication(true);
            //     let txHash: string|undefined = await initAccount(pass);
            //     setStep(STEP_7_PROCESSING_INIT);
            //     if (txHash) {
            //         storeInitTxHash(txHash);
            //         setInitTxHash(txHash);
            //     }
            // } catch (e: any) {
            //     console.error(e);
            // }
            // setGeneratingAuthentication(false);
        }
    }

    const onStepDifficultySet = async () => {
        if (pass) {
            console.log(pass);
            setDifficulty(parseInt(difficultyRef.current?.value||'0'));
            setDifficultyUnit(parseInt(difficultyUnitRef.current?.value || '1'));
            try {
                setGeneratingAuthentication(true);
                // let txHash: string|undefined = await initAccount(pass);
                // setStep(STEP_7_PROCESSING_INIT);
                // if (txHash) {
                //     storeInitTxHash(txHash);
                //     setInitTxHash(txHash);
                // }
            } catch (e: any) {
                console.error(e);
            }
        } else {
            setStep(STEP_4_WAITING_PASS);
        }
    }

    return <>
        <div className="app-window">
            {
                signupTxHash && !initTxHash &&
                <div style={{marginBottom: '40px', fontSize: '12px'}}>
                    deployment on tx <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', signupTxHash)}`}>{formatAddress(signupTxHash)}</a>...
                </div>
            }
            {
                initTxHash &&
                <div style={{marginBottom: '40px', fontSize: '12px'}}>
                    account auth init on tx <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', initTxHash)}`}>{formatAddress(initTxHash)}</a>...
                </div>
            }
            {/* {feesAccountAddress && feesAccountBalance !== undefined && */}
                <div style={{marginBottom: '20px', lineHeight: '30px'}}>
                    Fees Address: <span style={{fontWeight: '600'}} onClick={copyToClipboard} data-copy={feesAccountAddress}>{feesAccountAddress ? formatAddress(feesAccountAddress) : 'loading' }</span><br />
                    {
                        feesAccountBalance!==undefined &&
                        <>
                            Balance: <span>{formatBalancePrimitive(feesAccountBalance)}</span>
                            <span style={{fontSize: '10px'}}>{symbol}</span>
                        </>
                    }
                    {
                        feesAccountBalance===undefined &&
                        <>
                            Balance: <span>loading...</span>
                        </>
                    }
                </div>
            {/* } */}
            {
                message &&
                <>
                    <div className="message">
                        {message}
                    </div>
                </>
            }
            {
                errorMessage &&
                <>
                    <div onClick={() => setErrorMessage(undefined)} className="error-message">
                        {errorMessage}
                    </div>
                </>
            }
            {
                isLoadingAccount &&
                <>
                    loading account...
                </>
            }
            {
                step === STEP_1_GEN_FEES_ACCOUNT && !isLoadingAccount &&
                <>
                    <button disabled={true}>Deploy</button>
                </>
            }
            {
                step === STEP_2_WAITING_DEPLOY &&
                <>
                    {
                        !isDeployInProcess &&
                        <button onClick={onStepDeployDone}>Deploy</button>
                    }
                    {
                        isDeployInProcess &&
                        <>
                            deploying...<br />
                            <button disabled={true}>Deploy</button>
                        </>
                    }
                </>
            }
            {
                step === STEP_3_PROCESSING_DEPLOY &&
                <>
                    processing account creation
                </>
            }
            {
                step === STEP_4_WAITING_PASS &&
                <>
                    Enter password here <input ref={passRef} type={'password'} /><br />
                    <button onClick={onStepPassDone}>Next {'>'}</button>
                </>
            }
            {
                step === STEP_5_WAITING_RE_PASS &&
                <>
                    Re-Enter password here <input ref={rePassRef} type={'password'} /><br />
                    <button onClick={onStepPassReDone}>Next</button>
                </>
            }
            {
                step === STEP_5_WAITING_DIFFICULTY &&
                <>
                    Enter difficulty (in sec) <input ref={difficultyRef} type={'number'} />
                    <select ref={difficultyUnitRef}>
                        <option value={1}>Milliseconds</option>
                        <option value={1000} selected={true}>Seconds</option>
                        <option value={1000*60}>Min</option>
                        <option value={1000*60*60}>Hours</option>
                        <option value={1000*60*60*24}>Days</option>
                    </select>
                    <br />
                    <button onClick={onStepDifficultySet}>Next</button>
                </>
            }
            {
                (step === STEP_6_WAITING_INIT || step === STEP_7_PROCESSING_INIT) &&
                <>
                    processing auth gen
                </>
            }
            {
                step === STEP_8_DONE &&
                <>
                    Congratulations!
                </>
            }
            {
                accountAddress &&
                <div style={{ fontSize: '12px', marginBottom: '60px' }}>
                    <Link to={'/app'}>connected as {formatAddress(accountAddress)}</Link>
                </div>
            }
            <div style={{marginTop: '30px'}}>
                or<br />
                <Link to={'/app/signin'}>sign-in</Link>
            </div>
        </div>
        <div style={{marginTop: '40px', fontSize: '10px'}}>powered by<br />
            <img style={{ width: '100px' }} src={process.env.PUBLIC_URL+'logo.jpeg'} />
        </div>
    </>;
}
export default Step3;