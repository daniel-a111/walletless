import { createRef, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { getAccountAddress, getBalance } from "../account/Account";

const SignTransaction = () => {
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();

    let [to] = useState<string>(searchParams.get('to')||'');
    let [value] = useState<string>(searchParams.get('value')||'0.0');
    let [data] = useState<string>(searchParams.get('data')||'');

    const [accountAddress] = useState<string|undefined>(getAccountAddress());
    if (!accountAddress) {
        setTimeout(() => {
            navigate(`/app/signup`);
        }, 1000);
    }
    const [balance, setBalance] = useState<number>(0);
    const [mount] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setBalance(await getBalance());
        })();
    }, [mount]);

    const signRef = createRef<HTMLInputElement>();

    const onClickSign = async () => {
        // await transact(to, value, data, signRef.current?.value||'');
    }
    return <>
        <div style={{ width: '800px', margin: '0 auto' }}>
            {accountAddress &&
                <>
                    you are connected to<br />
                    <span style={{ fontSize: '24px', cursor: 'pointer' }} 
                        data-copy={accountAddress}
                        onClick={copyToClipboard}>{formatAddress(accountAddress||'')}</span>
                    <div style={{ marginTop: '60px' }}>
                        Total Balance<br /><span style={{ fontSize: '28px' }}>{formatBalancePrimitive(balance)}$</span>
                    </div>

                    <div style={{marginTop: '20px'}}>
                        <input disabled={true} type={'text'} defaultValue={to||''} />
                        <input disabled={true} type={'number'} defaultValue={value||''} />
                        <textarea disabled={true} defaultValue={data||''} /><br />
                        <input type={'password'} ref={signRef} />
                        <button onClick={onClickSign}>sign</button>
                    </div>
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
export default SignTransaction;