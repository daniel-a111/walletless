import { createRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAccountAddress, signup } from "../account/Account";
import { formatAddress } from "../utils";

const Signup = () => {

    const passRef = createRef<HTMLInputElement>();
    const rePassRef = createRef<HTMLInputElement>();
    const [accountAddress] = useState<string|undefined>(getAccountAddress());

    const STEP_PASS = 'STEP_PASS';
    const STEP_PASS_RE = 'STEP_PASS_RE';
    const STEP_DONE = 'STEP_DONE';

    const [step, setStep] = useState<string>(STEP_PASS);
    const [pass, setPass] = useState<string>();

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
            setStep(STEP_DONE);
        }
    }

    return <>
        <div className="app-window">
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