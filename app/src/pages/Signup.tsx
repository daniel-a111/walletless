import { createRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAccountAddress, getFeesAccountAddress, getFeesAccountBalance, signup } from "../account/Account";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";

const Signup = () => {

    const passRef = createRef<HTMLInputElement>();
    const rePassRef = createRef<HTMLInputElement>();
    const [accountAddress, setAccountAddress] = useState<string|undefined>(getAccountAddress());

    const [feesAccountAddress, setFeesAccountAddress] = useState<string|undefined>();
    const [feesAccountBalance, setFeesAccountBalance] = useState<number|undefined>();

    const STEP_PASS = 'STEP_PASS';
    const STEP_PASS_RE = 'STEP_PASS_RE';
    const STEP_DONE = 'STEP_DONE';

    const [mount] = useState<boolean>(true);
    const [step, setStep] = useState<string>(STEP_PASS);
    const [pass, setPass] = useState<string>();

    useEffect(() => {
        (async () => {
            setFeesAccountAddress(await getFeesAccountAddress());
            setFeesAccountBalance(parseFloat(await getFeesAccountBalance()));
        })();
    })
    const onStepPassDone = () => {
        if (passRef.current?.value) {
            setPass(passRef.current?.value);
            setStep(STEP_PASS_RE);
        }
    }

    const onStepPassReDone = async () => {
        if (pass === rePassRef.current?.value) {
            let newAccount = await signup(pass||'');
            console.log({newAccount});
            setAccountAddress(newAccount);
            setStep(STEP_DONE);
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
                accountAddress &&
                <div style={{ fontSize: '12px', marginBottom: '60px' }}>
                    <Link to={'/app'}>connected as {formatAddress(accountAddress)}</Link>
                </div>
            }
            {
                step === STEP_PASS &&
                <>
                    Enter password here <input ref={passRef} type={'password'} /><br />
                    <button onClick={onStepPassDone}>Next</button>
                </>
            }
            {
                step === STEP_PASS_RE &&
                <>
                    Re-Enter password here <input ref={rePassRef} type={'password'} /><br />
                    <button onClick={onStepPassReDone}>Next</button>
                </>
            }
            {
                step === STEP_DONE &&
                <>
                    Congratulations!
                </>
            }

        </div>
    </>;
}
export default Signup;