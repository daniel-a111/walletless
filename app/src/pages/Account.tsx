import { createRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { getAccount, getAccountAddress, getBalance, getGasFeesBalance, resetPassword, setRGFParams, setRGFProvider } from "../account/Account";

const Account = () => {
    let navigate = useNavigate();

    const [account, setAccount] = useState<any>();
    const [accountAddress] = useState<string|undefined>(getAccountAddress());
    const [gasFeesBalance, setGasFeesBalance] = useState<number>(0);
    if (!accountAddress) {
        setTimeout(() => {
            navigate(`/app/signup`);
        }, 1000);
    }
    const [balance, setBalance] = useState<number>(0);

    const [pass, setPass] = useState<string|undefined>();
    const [RGF, setRGF] = useState<number|undefined>();
    const [RGFM, setRGFM] = useState<number|undefined>();
    const [MIN_RGF, setMIN_RGF] = useState<number|undefined>();
    const [RGFProviderAddress, setRGFProviderAddress] = useState<string|undefined>();

    const passRef = createRef<HTMLInputElement>();
    const rePassRef = createRef<HTMLInputElement>();
    const [mount] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setAccount(await getAccount());
            setBalance(await getBalance());
            setGasFeesBalance(await getGasFeesBalance());
        })();
    }, [mount]);

    const STEP_PASS = 'STEP_PASS';
    const STEP_PASS_RE = 'STEP_PASS_RE';
    const STEP_AUTH = 'STEP_AUTH';
    const STEP_DONE = 'STEP_DONE';

    const [step, setStep] = useState<string>(STEP_PASS);

    const onStepPass1Done = () => {
        if (passRef.current?.value) {
            setPass(passRef.current?.value);
            setStep(STEP_PASS_RE);
        }
    }
    const onStepPass1ReDone = () => {
        if (pass === rePassRef.current?.value) {
            setStep(STEP_AUTH);
        }
    }

    const onStepAuthDone = async () => {
        if (pass) {
            await resetPassword(pass, authPasswordRef.current?.value||'');
        }
    }
    const authPasswordRef = createRef<HTMLInputElement>();

    const RGFRef = createRef<HTMLInputElement>();
    const RGFMRef = createRef<HTMLInputElement>();
    const MIN_RGFRef = createRef<HTMLInputElement>();

    const newRGFAddressRef = createRef<HTMLInputElement>();

    const rgfmModeRef = createRef<HTMLInputElement>();
    const [rgfChangeParams, setRgfChangeParams] = useState<boolean>(true);

    const rgfmEditChanged = () => {
        setRgfChangeParams(!!(rgfmModeRef.current?.checked));
    }

    const [authRGF, setAuthRGF] = useState<boolean>(false);
    const onClickSubmitRFGParams = () => {
        setRGF(parseInt(RGFRef.current?.value||'0'));
        setRGFM(parseInt(RGFMRef.current?.value||'0'));
        setMIN_RGF(parseInt(MIN_RGFRef.current?.value||'0'));
        setAuthRGF(true);

    }
    const onClickAuthRGFParamsSubmit = async () => {
        if (RGF && RGFM && MIN_RGF && authPasswordRef.current?.value) {
            await setRGFParams(
                RGF||0,
                RGFM||0,
                MIN_RGF||0,
                authPasswordRef.current?.value||''
            );
        }
    }
    const onClickSubmitChangeRFG = () => {
        setRGFProviderAddress(newRGFAddressRef.current?.value||'');
        setAuthRGF(true);
    }
    const onClickAuthChangeRGFSubmit = async () => {
        if (RGFProviderAddress && authPasswordRef.current?.value||'') {
            await setRGFProvider(
                RGFProviderAddress||'',
                authPasswordRef.current?.value||''
            );
        }
    }
    return <>
        {/* <AppHeader /> */}
        <div className="app-window">
            <Link style={{ float: 'left', display: 'inline-block', marginTop: '-60px' }} to={'/app'}>back</Link>
            {accountAddress &&
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
                    <h3 style={{ marginTop: '80px' }}>RGF configuration</h3>
                    {!authRGF &&
                        <>
                            <label>Change exists <input ref={rgfmModeRef} onClick={rgfmEditChanged} name={'rgfm-edit'} type={'radio'} defaultChecked={true} /></label>
                            <label>Set new <input onClick={rgfmEditChanged} name={'rgfm-edit'} type={'radio'} /></label>
                        </>
                    }
                    <div>
                        {rgfChangeParams && account &&
                            <>
                                {!authRGF &&
                                    <div>
                                        <label>RGF <input defaultValue={account.RGFProvider.RGF} type={'number'} ref={RGFRef} /></label><br />
                                        <label>RGFM <input defaultValue={account.RGFProvider.RGFM} type={'number'} ref={RGFMRef} /></label>< br/>
                                        <label>MIN RGF <input defaultValue={account.RGFProvider.MIN_RGF} type={'number'} ref={MIN_RGFRef} /></label>
                                        <button onClick={onClickSubmitRFGParams}>submit</button>
                                    </div>
                                }
                                {
                                    authRGF &&
                                    <div>
                                        <label>password <input type={'password'} ref={authPasswordRef} /></label><br />
                                        <button onClick={onClickAuthRGFParamsSubmit}>auth</button>
                                    </div>
                                }
                            </>
                        }
                        {
                            !rgfChangeParams &&
                            <>
                                {
                                    !authRGF &&
                                    <div>
                                        <label>Adderss <input defaultValue={account.RGFProvider.address} type={'text'} ref={newRGFAddressRef} /></label><br />
                                        <button onClick={onClickSubmitChangeRFG}>submit</button>
                                    </div>
                                }
                                {
                                    authRGF &&
                                    <div>
                                        <label>password <input  type={'password'} ref={authPasswordRef} /></label><br />
                                        <button onClick={onClickAuthChangeRGFSubmit}>auth</button>
                                    </div>
                                }
                            </>
                        }
                    </div>
                    <h3 style={{ marginTop: '80px' }}>Reset Password</h3>
                    {
                        step === STEP_PASS &&
                        <>
                            Enter first password here <input ref={passRef} type={'password'} /><br />
                            <button onClick={onStepPass1Done}>Next</button>
                        </>
                    }
                    {
                        step === STEP_PASS_RE &&
                        <>
                            Re-Enter first password here <input ref={rePassRef} type={'password'} /><br />
                            <button onClick={onStepPass1ReDone}>Next</button>
                        </>
                    }
                    {
                        step === STEP_AUTH &&
                        <>
                            Password: <input type={'password'} ref={authPasswordRef} />
                            <button onClick={onStepAuthDone}>submit</button>
                        </>
                    }
                    {
                        step === STEP_DONE &&
                        <>
                            Added!
                        </>
                    }
                    <div className="clear"></div>
                </>
            }
            {
                !accountAddress &&
                <>
                    <Link to={'/app/signup'}>Redirecting to Signup page</Link>
                </>
            }
        </div>
        <div className="clear"></div>
    </>;
}
export default Account;