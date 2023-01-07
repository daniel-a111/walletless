import { createRef, useEffect, useState } from "react";
import * as walletless from '../walletless';
import '../scss/signup.scss';
import { InitSCAA } from "../walletless/pipeline";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";

let pass: any;
let difficulty: any;
let difficultyUnit: any;

interface PasswordForm {
    pass: string;
    difficulty: number;
    difficultyUnit: number;
}

const SetPassword = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(true);
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const [passwordForm, setPasswordForm] = useState<PasswordForm|undefined>()

    const [init, setInit] = useState<InitSCAA|undefined>();

    const passwordRef = createRef<HTMLInputElement>();
    const rePasswordRef = createRef<HTMLInputElement>();
    const difficultyRef = createRef<HTMLInputElement>();
    const difficultyUnitRef = createRef<HTMLSelectElement>();

    const loadGasFees = async () => {
        // setFeesAccount(walletless.getState().gasProvider);
        let wallet = walletless.getState()
        setWallet(wallet);
    }
    useEffect(() => {
        loadGasFees();
    }, [mount]);

    const onClickNext = async () => {
        if (!pass && !difficulty && !difficultyUnit) {
            pass = passwordRef.current?.value||'';
            difficulty = parseInt(difficultyRef.current?.value||'0');
            difficultyUnit = parseInt(difficultyUnitRef.current?.value||'0');   
            setPasswordForm({ pass, difficulty, difficultyUnit })
        } else {
            let repass = rePasswordRef.current?.value||'';
            if (repass === pass) {
                console.log('set password...');
                difficulty = walletless.difficultyTimeToIterations(difficulty, difficultyUnit);
                let state: walletless.WalletlessState = walletless.getState();
                let cert = walletless.crypto.preImageChain((state.account?.address||'')+pass, difficulty);
                
                let wallet = new ethers.Contract(state.account?.address||'',walletless.abis.walletlessIface );
                let rawTx = await wallet.populateTransaction.resetCert(cert);
                let valueHex = '0x0';
                navigate(`/transfer/sign?to=${rawTx.to}&value=${valueHex}&data=${rawTx.data}`)

                console.log({rawTx})
                // let init: InitSCAA = await walletless.initSCAA(
                //     walletless.getState()?.account?.address||'', pass, difficulty, difficultyUnit, 
                //     walletless.getState().gasProvider?.address||'', walletless.getState().gasProvider?.key||''
                // );
                // setInit(init);
                // let wallet = walletless.getState()
                // setWallet(wallet);
        
            } else {
                console.log();
            }
        }
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
            <div className="enter-password-form">
                {
                    (!pass || !difficulty || !difficultyUnit) &&
                    <>
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
                    </>
                }
                {
                    (pass && difficulty && difficultyUnit) &&
                    <>
                        <span>Re-enter Password</span>
                        <input ref={rePasswordRef} type={'password'} />
                        <span className="input-show-password">
                            <img src={process.env.PUBLIC_URL+'/icons/show-password.svg'} />
                        </span>
                    </>
                }
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
export default SetPassword;