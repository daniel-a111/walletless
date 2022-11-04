import { createRef, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { getAccount, getAccountAddress, getBalance, getGasFeesBalance, resetPassword, setRGFParams, setRGFProvider } from "../account/Account";
import ResetPasswordForm from "../components/ResetPasswordForm";
import RGFForm from "../components/RGFForm";

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
    const [mount] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            setAccount(await getAccount());
            setBalance(await getBalance());
            setGasFeesBalance(await getGasFeesBalance());
        })();
    }, [mount]);

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
                    <RGFForm />
                    <ResetPasswordForm />
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