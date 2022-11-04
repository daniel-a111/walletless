import { createRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAccountAddress, resetPassword } from "../account/Account";

const STEP_PASS = 'STEP_PASS';
const STEP_PASS_RE = 'STEP_PASS_RE';
const STEP_AUTH = 'STEP_AUTH';
const STEP_DONE = 'STEP_DONE';

const ResetPasswordForm = () => {
    let navigate = useNavigate();
    const [accountAddress] = useState<string|undefined>(getAccountAddress());
    if (!accountAddress) {
        setTimeout(() => {
            navigate(`/app/signup`);
        }, 1000);
    }

    const [pass, setPass] = useState<string|undefined>();
    const passRef = createRef<HTMLInputElement>();
    const rePassRef = createRef<HTMLInputElement>();
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
    return <>
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
    </>;
}
export default ResetPasswordForm;