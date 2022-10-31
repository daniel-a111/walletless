import { createRef, useState } from "react";
import { Link } from "react-router-dom";
import { getAccountAddress, signin } from "../account/Account";
import { storeAccountAddress } from "../account/storage";
import { formatAddress } from "../utils";

const Signin = () => {

    const [accountAddress, setAccountAddress] = useState<string|undefined>(getAccountAddress());

    const addressRef = createRef<HTMLInputElement>();
    const passRef = createRef<HTMLInputElement>();

    const STEP_1_ADDRESS = 'STEP_1_ADDRESS';
    const STEP_2_PASS = 'STEP_2_PASS';
    const STEP_3_DONE = 'STEP_DONE';

    const [step, setStep] = useState<string>(STEP_1_ADDRESS);
    const [address, setAddress] = useState<string>();

    const onStep1Done = () => {
        setAddress(addressRef.current?.value);
        setStep(STEP_2_PASS);
    }

    const onStep2Done = async () => {

        if (address) {
            let pass = passRef.current?.value||'';
            let isLoggedIn = await signin(address, pass);
            if (isLoggedIn) {
                setAccountAddress(address);
                storeAccountAddress(address);
                setStep(STEP_3_DONE);
            } else {
                
            }
        }
    }

    return <>
        {/* <AppHeader /> */}
        <div className="app-window">
            {
                accountAddress &&
                <div style={{ fontSize: '12px', marginBottom: '60px' }}>
                    <Link to={'/app'}>connected as {formatAddress(accountAddress)}</Link>
                </div>
            }
            {
                step === STEP_1_ADDRESS &&
                <>
                    Enter address <input ref={addressRef} type={'text'} /><br />
                    <button onClick={onStep1Done}>Next</button>
                </>
            }
            {
                step === STEP_2_PASS &&
                <>
                    Enter password here <input ref={passRef} type={'password'} /><br />
                    <button onClick={onStep2Done}>Next</button>
                </>
            }
            {
                step === STEP_3_DONE &&
                <>
                    You logged in login!
                </>
            }
            <div style={{marginTop: '30px'}}>
                or<br />
                <Link to={'/app/signup'}>sign-up</Link>
            </div>

        </div>
    </>;
}
export default Signin;