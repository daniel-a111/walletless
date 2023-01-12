import { createRef, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as walletless from "../walletless";
var QRCode = require('qrcode');

const TestPassword = () => {

    let navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [to] = useState<string>(searchParams.get("to")||'');
    const [value] = useState<string>(searchParams.get("value")||'0x0');
    const [data] = useState<string>(searchParams.get("data")||'');
    const [isProcessing, setProcessing] = useState<boolean>();
    const [pendings, setPendings] = useState<any[]>();
    const [activatePending, setActivatePending] = useState<any>();
    const [isTesting, setTesting] = useState<boolean>(false);
    const [isPassed, setPassed] = useState<boolean>(false);
    const [proofProof, setProofProof] = useState<string|undefined>();

    const [mount] = useState<boolean>(false);
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const passwordRef = createRef<HTMLInputElement>();
    const difficultyRef = createRef<HTMLInputElement>();
    const difficultyUnitRef = createRef<HTMLSelectElement>();
    const canvasRef = createRef<HTMLCanvasElement>();


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
        let access = await walletless.testPassword({
            transaction: {
                from: wallet?.account?.address || '',
                to: '',
                value: '',
                data: ''
            },
            password: passwordRef?.current?.value || '',
            difficulty: parseInt(difficultyRef.current?.value||'0'),
            difficultyUnit: parseInt(difficultyUnitRef.current?.value||'0')
        });
        setTesting(true);
        setPassed(!!access?.proofProof);
        setProofProof(access?.proofProof);
        if (access?.proofProof) {
            var canvas = canvasRef.current;
            console.log(canvas);
            QRCode.toCanvas(canvas, access?.proofProof, function (error: any) {
                if (error) console.error(error)
                    console.log('success!');
            });
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
                {isTesting &&
                    <>
                        {
                            isPassed &&
                            <>
                                PASSED!
                                <canvas ref={canvasRef}></canvas>
                            </>
                        }
                        {
                            !isPassed &&
                            <>
                                NOT PASSED!
                            </>
                        }
                    </>
                }
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
    </>;
}
export default TestPassword;