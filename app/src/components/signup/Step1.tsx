import { useEffect, useState } from "react";
import * as walletless from '../../walletless';
import '../../scss/signup.scss';
import { copyToClipboard } from "../../utils";
import { DeploySCAA } from "../../walletless/pipeline";
import { useNavigate } from "react-router-dom";

const Step1 = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(true);
    const [address] = useState<string|undefined>(walletless.getState().address);
    const [feesAccount, setFeesAccount] = useState<walletless.types.GasFeesProvider|undefined>(walletless.getState().gasProvider);
    const [deploy, setDeploy] = useState<DeploySCAA|undefined>(walletless.getDeploy());

    const loadGasFees = async () => {
        setFeesAccount(walletless.getState().gasProvider);
        setTimeout(() => {
            loadGasFees(); 
        }, 2000);
    }
    useEffect(() => {
        loadGasFees();
    }, [mount]);

    // useEffect(() => {
    //     if (address) {
    //         navigate('/app/signup/step2');
    //     }
    // }, [address]);

    // const waitingDeployDone = (deploy: DeploySCAA) => {
    //     if (deploy.getState() === 'done') {
    //         navigate('/app/signup/step2');
    //     } else {
    //         setTimeout(() => {
    //             waitingDeployDone(deploy);
    //         }, 1000);    
    //     }
    // }

    // useEffect(() => {
    //     if (deploy) {
    //         waitingDeployDone(deploy);
    //     }
    // }, [deploy]);

    const onClickNext = async () => {
        console.log('deploying...');
        navigate('/app/signup/step2');
        // let deploy: DeploySCAA = await walletless.deploySCAA();
        // setDeploy(deploy);
    }

    return <>
        {
            deploy &&
            'On DEPLOY!' + deploy.getState()
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
                <h1>Add gas fee credit</h1>
                <p>Learn why gas fees are an essential part of the decentralised ecosystem</p>
                <a><img src={process.env.PUBLIC_URL+'/icons/more-info.svg'} /></a>
            </div>
            <div className="deposit-form">
                <span>AMOUNT</span>
                <input defaultValue={'0.0'} type={'number'} />
                <span className="input-sign-dollar">$</span>
                <div style={{height: '100px'}}>
                    <a className="deposit-method apple-pay"><img src={process.env.PUBLIC_URL+'/icons/apple-pay.png'} /></a>
                    <a className="deposit-method paypal"><img src={process.env.PUBLIC_URL+'/icons/paypal.png'} /></a>
                    <a className="deposit-method credit-card"><img src={process.env.PUBLIC_URL+'/icons/credit-card.png'} /></a>
                </div>
                {
                    feesAccount &&
                    <>
                        <div className="deposit-method-transfer"
                            onClick={copyToClipboard}
                            data-copy={feesAccount.address}>
                            <a data-copy={feesAccount.address}>Transfer externally <img src={process.env.PUBLIC_URL+'/icons/copy.svg'} /></a>
                        </div>
                        <div>
                            {parseFloat(feesAccount.balance)>0 && 
                            <button onClick={onClickNext} className="btn-primary">Next</button>
                            }
                            {parseFloat(feesAccount.balance)===0 && 
                            <button disabled={true} className="btn-primary">Next</button>
                            }
                        </div>
                    </>
                }
            </div>
        </div>
    </>;
}
export default Step1;