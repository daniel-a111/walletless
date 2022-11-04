import { createRef, useEffect, useState } from "react";
import { getAccount, getRGFProvider, setRGFParams, setRGFProvider } from "../account/Account";

const RGFForm = () => {
    const [account, setAccount] = useState<any>();
    const [rgfProvider, setRgfProvider] = useState<any>();
    const [RGF, setRGF] = useState<number|undefined>();
    const [RGFM, setRGFM] = useState<number|undefined>();
    const [MIN_RGF, setMIN_RGF] = useState<number|undefined>();
    const [RGFProviderAddress, setRGFProviderAddress] = useState<string|undefined>();
    const [mount, setMount] = useState<boolean>(false);
    const authPasswordRef = createRef<HTMLInputElement>();
    const RGFRef = createRef<HTMLInputElement>();
    const RGFMRef = createRef<HTMLInputElement>();
    const MIN_RGFRef = createRef<HTMLInputElement>();
    const newRGFAddressRef = createRef<HTMLInputElement>();
    const rgfmModeRef = createRef<HTMLInputElement>();
    const [rgfChangeParams, setRgfChangeParams] = useState<boolean>(true);
    useEffect(() => {
        (async () => {
            setAccount(await getAccount());
            setRgfProvider(await getRGFProvider())
        })();
    }, [mount]);

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
        <h3 style={{ marginTop: '80px' }}>RGF configuration</h3>
        {!authRGF &&
            <>
                <label>Change exists <input ref={rgfmModeRef} onClick={rgfmEditChanged} name={'rgfm-edit'} type={'radio'} defaultChecked={true} /></label>
                <label>Set new <input onClick={rgfmEditChanged} name={'rgfm-edit'} type={'radio'} /></label>
            </>
        }
        <div>
            {rgfChangeParams && account && rgfProvider &&
                <>
                    {!authRGF &&
                        <div>
                            <label>RGF <input defaultValue={rgfProvider.RGF} type={'number'} ref={RGFRef} /></label><br />
                            <label>RGFM <input defaultValue={rgfProvider.RGFM} type={'number'} ref={RGFMRef} /></label>< br/>
                            <label>MIN RGF <input defaultValue={rgfProvider.MIN_RGF} type={'number'} ref={MIN_RGFRef} /></label>
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
                            <label>Adderss <input defaultValue={rgfProvider.address} type={'text'} ref={newRGFAddressRef} /></label><br />
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
    </>;
}
export default RGFForm;