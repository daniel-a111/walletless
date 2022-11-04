import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { copyToClipboard, formatAddress, formatBalancePrimitive } from "../utils";
import { clearAccount, getAccount, getBalance, getFeesAccountBalance } from "../account/Account";
import { loadAccountAddress } from "../account/storage";
import TransactForm from "../components/TransactForm";
import MoreActionsMenu from "../components/MoreActionsMenu";
import PaymentForm from "../components/PaymentForm";

const Home = () => {
    let navigate = useNavigate();
    const [searchParams] = useSearchParams();
    let clear = searchParams.get("clear");

    const [mount] = useState<boolean>(false);
    const [accountAddress, setAccountAddress] = useState<string|undefined>(loadAccountAddress());
    const [balance, setBalance] = useState<number>(0);
    const [gasFeesBalance, setGasFeesBalance] = useState<number>(0);

    const loadBalances = async () => {
        setBalance(await getBalance());
        setGasFeesBalance(parseFloat(await getFeesAccountBalance()));
        setTimeout(loadBalances, 3000);

        let account = await getAccount();
        if (!account.cert) {
            navigate('/app/signup');
        }
    }
    useEffect(() => {
        (async () => {
            if (clear) {
                clearAccount();
            }
            setAccountAddress(loadAccountAddress());
        })();
        loadBalances();
    }, [mount]);

    const ACTION_PAYMENT_GATEWAY = 1;
    const ACTION_TRANSFER = 2;
    const ACTION_OTHER = 3;
    const [action, setAction] = useState<number|null>();

    const [subAction, setSubAction] = useState<number|null>();

    return <>
        <div className="app-window">
            {
                accountAddress &&
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
                    <div className="take-action-box">
                        {
                            <>
                                {!action &&
                                    <>
                                        <span className="main-menu-title">What do you like to do?</span><br />
                                        <span className="main-menu-item"
                                            onClick={() => setAction(ACTION_PAYMENT_GATEWAY)}>create payment gateway</span>
                                        <span className="main-menu-item"
                                            onClick={() => setAction(ACTION_TRANSFER)}
                                        >transfer</span>
                                        <span
                                            onClick={() => setAction(ACTION_OTHER)}
                                        className="main-menu-item">more actions</span>
                                    </>
                                }
                                {
                                    action &&
                                    <>
                                        {
                                            !subAction &&
                                            <span className="left" onClick={() => setAction(null)}>back</span>
                                        }
                                        {
                                            subAction &&
                                            <span className="left" onClick={() => setSubAction(null)}>back</span>
                                        }
                                        <br />
                                    </>
                                }
                                {
                                    action === ACTION_TRANSFER &&
                                    <TransactForm />
                                }
                                {
                                    action === ACTION_PAYMENT_GATEWAY &&
                                    <PaymentForm />
                                }
                                {
                                    action === ACTION_OTHER &&
                                    <MoreActionsMenu />
                                }
                            </>
                        }
                    </div>
                </>
            }
            {
                !accountAddress &&
                <>
                    <span
                        onClick={() => navigate(`/app/signin`)}
                        className="main-menu-item">Sign in account</span>
                    <span className="main-menu-item"
                        onClick={() => navigate(`/app/signup`)}
                    >Create new account</span>
                </>
            }
        </div>
        <div className="clear"></div>
    </>;
}
export default Home;