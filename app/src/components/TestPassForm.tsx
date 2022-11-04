import { createRef, useState } from "react";
import { testPassword } from "../account/Account";
import { loadAccountAddress } from "../account/storage";

const TestPassForm = () => {

    const [accountAddress] = useState<string|undefined>(loadAccountAddress());
    const [testPassPassed, setTestPassPassed] = useState<boolean|undefined>();
    const testPassRef = createRef<HTMLInputElement>();
    const onClickTestPassword = async () => {
        setTestPassPassed(await testPassword(testPassRef.current?.value||''));
    }

    return <>
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
    </>;
}
export default TestPassForm;