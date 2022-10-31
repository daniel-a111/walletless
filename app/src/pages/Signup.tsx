import { createRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deployAccount, getAccount, getAccountAddress, getFeesAccountAddress, getFeesAccountBalance, initAccount } from "../account/Account";
import { loadFeesAccountAddress, loadInitTxHash, loadSignupTxHash, storeAccountAddress, storeInitTxHash, storeSignupTxHash } from "../account/storage";
import * as Backend from "../backend";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";

const Signup = () => {

    const passRef = createRef<HTMLInputElement>();
    const rePassRef = createRef<HTMLInputElement>();
    const [accountAddress, setAccountAddress] = useState<string|undefined>(getAccountAddress());
    const [signupTxHash, setSignupTxHash] = useState<string|undefined>(loadSignupTxHash());
    const [initTxHash, setInitTxHash] = useState<string|undefined>(loadInitTxHash());
    const [feesAccount, setFeesAccount] = useState<string|undefined>(loadFeesAccountAddress());

    const [feesAccountAddress, setFeesAccountAddress] = useState<string|undefined>();
    const [feesAccountBalance, setFeesAccountBalance] = useState<number|undefined>();

    const STEP_1_GEN_FEES_ACCOUNT = 'STEP_1_GEN_FEES_ACCOUNT';
    const STEP_2_WAITING_DEPLOY = 'STEP_2_WAITING_DEPLOY';
    const STEP_3_PROCESSING_DEPLOY = 'STEP_3_PROCESSING_DEPLOY';
    const STEP_4_WAITING_PASS = 'STEP_4_WAITING_PASS';
    const STEP_5_WAITING_RE_PASS = 'STEP_5_WAITING_RE_PASS';
    const STEP_6_WAITING_INIT = 'STEP_6_WAITING_INIT';
    const STEP_7_PROCESSING_INIT = 'STEP_7_PROCESSING_INIT';
    const STEP_8_DONE = 'STEP_8_DONE';

    const [mount] = useState<boolean>(true);
    const [step, setStep] = useState<string>(STEP_1_GEN_FEES_ACCOUNT);
    const [pass, setPass] = useState<string>();

    useEffect(() => {
        (async () => {
            let account = await getAccount();
            if (account?.cert) {
                setStep(STEP_8_DONE);
            } else if (accountAddress && initTxHash) {
                setStep(STEP_7_PROCESSING_INIT);
            } else if (accountAddress) {
                setStep(STEP_4_WAITING_PASS);
            } else if (signupTxHash) {
                setStep(STEP_3_PROCESSING_DEPLOY);
            } else if (feesAccount) {
                setStep(STEP_2_WAITING_DEPLOY);
            } else {
                setStep(STEP_1_GEN_FEES_ACCOUNT);
            }
            setFeesAccountAddress(await getFeesAccountAddress());
            setFeesAccountBalance(parseFloat(await getFeesAccountBalance()));
        })();
    }, [mount]);

    const handleSignupTxHash = async () => {
        if (!signupTxHash) {
            setTimeout(handleSignupTxHash, 1000);
            return;
        }
        let { done, success, account } = await Backend.signupTxStatus(signupTxHash||'');
        if (account?.address) {
            storeAccountAddress(account.address);
            setAccountAddress(account.address);
            storeSignupTxHash(null);
            setStep(STEP_4_WAITING_PASS);
        }
        if (!done) {
            setTimeout(handleSignupTxHash, 1000);
        } else if (!success) {
            setStep(STEP_2_WAITING_DEPLOY);
        }
    }

    const handleInitTxHash = async () => {
        if (!initTxHash) return;
        let { done, success, account }: any = await Backend.initTxStatus(initTxHash||'');
        if (success) {
            storeInitTxHash(null);
            setStep(STEP_8_DONE);
        }
    }
    useEffect(() => {
        if (step === STEP_3_PROCESSING_DEPLOY) {
            handleSignupTxHash();
        } else if (step === STEP_7_PROCESSING_INIT) {
            handleInitTxHash();
        }
    }, [step]);

    const onStepDeployDone = async () => {
        await deployAccount();
        setSignupTxHash(loadSignupTxHash());
        setStep(STEP_3_PROCESSING_DEPLOY);
    }

    const onStepPassDone = () => {
        if (passRef.current?.value) {
            setPass(passRef.current?.value);
            setStep(STEP_5_WAITING_RE_PASS);
        }
    }

    const onStepPassReDone = async () => {
        if (pass && pass === rePassRef.current?.value) {

            console.log('INIT');

            let txHash: string|undefined = await initAccount(pass);
            if (txHash) {
                storeInitTxHash(txHash);
                setInitTxHash(txHash);
                setStep(STEP_7_PROCESSING_INIT);
            }
        }
    }

    return <>
        <div className="app-window">
            {feesAccountAddress && feesAccountBalance !== undefined &&
                <div style={{marginBottom: '20px', lineHeight: '30px'}}>
                    Fees Address: <span style={{fontWeight: '600'}} onClick={copyToClipboard} data-copy={feesAccountAddress}>{formatAddress(feesAccountAddress)}</span><br />
                    Balance: <span>{formatBalancePrimitive(feesAccountBalance)}$</span>
                </div>
            }

            {
                step === STEP_1_GEN_FEES_ACCOUNT &&
                <>
                    generating fees account...
                </>
            }
            {
                step === STEP_2_WAITING_DEPLOY &&
                <>
                    <button onClick={onStepDeployDone}>Deploy</button>
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
                    <button onClick={onStepPassDone}>Next</button>
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
    </>;
}
export default Signup;