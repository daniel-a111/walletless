import { createRef, useState } from "react";
import { signin } from "../account/Account";
import { storeAccountAddress } from "../account/storage";

const Signin = () => {

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

        </div>
    </>;
}
export default Signin;