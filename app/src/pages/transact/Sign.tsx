import { createRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as walletless from "../../walletless";

const Sign = () => {

    let navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [to] = useState<string>(searchParams.get("to")||'');
    const [value] = useState<string>(searchParams.get("value")||'0x0');
    const [data] = useState<string>(searchParams.get("data")||'');
    const [isProcessing, setProcessing] = useState<boolean>();
    const [pendings, setPendings] = useState<any[]>();
    const [activatePending, setActivatePending] = useState<any>();

    const [mount] = useState<boolean>(false);
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const passwordRef = createRef<HTMLInputElement>();
    const difficultyRef = createRef<HTMLInputElement>();
    const difficultyUnitRef = createRef<HTMLSelectElement>();

    useEffect(() => {
        if (wallet) {
            let account: any = wallet.account;
            console.log(account.processing);
            console.log(walletless.NULL_CERT);
            setProcessing(account.processing !== walletless.NULL_CERT);
            setPendings(account.pending);
        }
    }, [wallet]);

    const onClickSignTransaction = async () => {
        console.log({isProcessing});
        if (isProcessing) {
            let {proof, pending} = await walletless.continueExpose({
                transaction: {
                    from: walletless.getState().account?.address || '',
                    to,
                    value,
                    data
                },
                password: passwordRef?.current?.value || '',
                difficulty: parseInt(difficultyRef.current?.value||'0'),
                difficultyUnit: parseInt(difficultyUnitRef.current?.value||'0')
            });
            console.log({
                proof, pending
            });
            
            setActivatePending(pending||null);

        } else {
            let transact = await walletless.transact({
                transaction: {
                    from: walletless.getState().account?.address || '',
                    to,
                    value,
                    data
                },
                password: passwordRef?.current?.value || '',
                difficulty: parseInt(difficultyRef.current?.value||'0'),
                difficultyUnit: parseInt(difficultyUnitRef.current?.value||'0')
            });
            console.log({transact});
        }
    };

    const onClickContinueExpose = () => {
        walletless.exposeContinues(wallet.account?.address||'');
    }

    return <>
        <h2>You are about make a transaction</h2>
        <br /><br /><br /><br />

        {
            wallet &&
            <>
                {isProcessing}
                {
                    isProcessing &&
                    <>
                        There is a processing!<br />
                        {activatePending}
                    </>
                }
                {
                    activatePending !== undefined && !activatePending &&
                    <>
                        No pending to execution<br />
                        continues?
                        <button onClick={onClickContinueExpose}>Yes, Continue</button>
                    </>
                }
                {
                    pendings && pendings?.map((pending: any) => {
                        return <>
                            {pending.to} {pending.value}<br />
                        </>
                    })
                }
                {
                    !isProcessing &&
                    <>
                    </>
                }
                {/* {
                    wallet.?account.?processing === NULL_CERT &&
                    <>
                    </>
                } */}
                <span>sign with password</span>
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
                <div>
                    <button onClick={onClickSignTransaction}>Send</button>
                </div>
            </>
        }
        {/* <div>
            sign with password: 
        </div> */}

    </>;
}
export default Sign;