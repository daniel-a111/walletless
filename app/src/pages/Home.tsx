import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as walletless from '../walletless'

const Home = () => {
    let navigate = useNavigate();
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const [mount] = useState<boolean>(false);

    const loadWalletless = () => {
        setWallet(walletless.getState());
        setTimeout(() => {
            loadWalletless();
        }, 300);
    }
    useEffect(() => {
        loadWalletless();
    }, [mount]);
    useEffect(() => {
        if (wallet.account) {
            if (wallet.account.cert === '0x0000000000000000000000000000000000000000000000000000000000000000') {
                // navigate('/app/signup/step2');
            } else {
                // navigate('/app/signup/manage');
            }
        }
    }, [wallet])

    const onClickCreateAccount = () => {
        navigate('/app/signup');
    }

    const onClickLogin = () => {
        
    }

    const onClickHowItWorks = () => {
        
    }

    return <>
        <h1>Walletless</h1>
        <h2>Decentralized & simplified</h2>

        <div className="menu-home">
            <button onClick={onClickCreateAccount} className="btn-primary">Create a account</button>
            <button onClick={onClickLogin}>Log in</button>
            <a onClick={onClickHowItWorks}>How does it work?</a>
        </div>
    </>;
}
export default Home;