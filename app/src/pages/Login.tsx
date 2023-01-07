import { createRef, useEffect, useState } from "react";
import * as walletless from '../walletless';
import '../scss/signup.scss';
import { InitSCAA } from "../walletless/pipeline";
import { useNavigate } from "react-router-dom";
import { authPreImageChain } from "../walletless/crypto";

const Login = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(true);
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());

    const [init, setInit] = useState<InitSCAA|undefined>();

    const accountRef = createRef<HTMLInputElement>();
    const passwordRef = createRef<HTMLInputElement>();
    const difficultyRef = createRef<HTMLInputElement>();
    const difficultyUnitRef = createRef<HTMLSelectElement>();

    const loadGasFees = async () => {
        // setFeesAccount(walletless.getState().gasProvider);
        let wallet = walletless.getState()
        setWallet(wallet);
        if (wallet.account?.cert !== '0x0000000000000000000000000000000000000000000000000000000000000000') {
            navigate('/app/manage');
        }
        

        // waitingDeployDone(init);

        // setTimeout(() => {
        //     loadGasFees(); 
        // }, 3000);
    }
    useEffect(() => {
        loadGasFees();
        // const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());

    }, [mount]);

    const onClickNext = async () => {
        let account = accountRef.current?.value||'';
        let pass = passwordRef.current?.value||'';
        let difficulty = parseInt(difficultyRef.current?.value||'0');
        let difficultyUnit = parseInt(difficultyUnitRef.current?.value||'0');

        await walletless.login(account, pass, difficulty, difficultyUnit);
        // console.log({
        //     account, pass, difficulty, difficultyUnit
        // });
        // let it = walletless.difficultyTimeToIterations(difficulty, difficultyUnit);
        // console.log(it);
        // console.log(account+pass, wallet?.account?.cert||'', it);
        // let auth = authPreImageChain(account+pass, wallet?.account?.cert||'', it);
        // console.log(auth);
        // if (auth) {

        //     console.log({
        //         account, pass, difficulty, difficultyUnit
        //     });
        // }
    }

    return <>
        {
            wallet.address
        }
        {
            wallet.init &&
            'On DEPLOY!' + wallet.init.status
        }
        <div className="app-window signup-window">
            <div className="page-header">
                <a className="btn-back">Back</a>
                <span>Create account</span>
            </div>
            <div className="menu-signup">
                <span className="item">1</span>
                <div className="seperator"></div>
                <span className="item">2</span>
                <div className="seperator"></div>
                <span className="item">3</span>
            </div>
            <div style={{marginTop: '40px'}}>
                <img style={{marginLeft: '14px'}} src={process.env.PUBLIC_URL+'/icons/gas-station.svg'} />
            </div>
            <div>
                <h1>Create password</h1>
                <p>This password contains decentaralised encryption and cannot be recovered.</p>
                <a><img src={process.env.PUBLIC_URL+'/icons/more-info.svg'} /></a>
            </div>
            <div>
                ADDRESS: <input ref={accountRef} type={'text'}  />
            </div>
            <div className="enter-password-form">
                <span>New Password</span>
                <input ref={passwordRef} type={'password'} />
                <span className="input-show-password">
                    <img src={process.env.PUBLIC_URL+'/icons/show-password.svg'} />
                </span>
                <span>Difficulty</span>
                <input ref={difficultyRef} type={'number'} />
                <select ref={difficultyUnitRef}>
                    <option value={1}>Milliseconds</option>
                    <option selected={true} value={1000}>Seconds</option>
                    <option value={60*1000}>Minutes</option>
                    <option value={60*60*1000}>Hours</option>
                    <option value={24*60*60*1000}>Days</option>
                </select>
                {
                    wallet.gasProvider &&
                    <>
                        <div>
                            {parseFloat(wallet.gasProvider.balance)>0 && 
                            <button onClick={onClickNext} className="btn-primary">Next</button>
                            }
                            {parseFloat(wallet.gasProvider.balance)===0 && 
                            <button disabled={true} className="btn-primary">Next</button>
                            }
                        </div>
                    </>
                }
            </div>
        </div>
    </>;
}
export default Login;