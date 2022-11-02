import { createRef, useEffect, useState } from "react";
import { formatAddress } from "../utils";
import { checkPending, exposeCont, pendingView, transactExpose, transactPreset } from "../account/Account";
import { topupData } from "../contracts";
import { loadExposeTxHash, loadPresetTxHash, loadTransact, storeExposeTxHash, storePresetTxHash, storeTransact, Transact } from "../account/storage";
import * as Backend from "../backend";
import config from "../config";

// let pass: string|undefined;
// let to: string|undefined;
// let from: string|undefined;
const TransactForm = () => {

    const [mount] = useState<boolean>(true);
    const [auth, setAuth] = useState<boolean>(false);

    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const dataRef = createRef<HTMLTextAreaElement>();
    const authRef = createRef<HTMLInputElement>();

    const [to, setTo] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [data, setData] = useState<string>('0x');
    const [pass, setPass] = useState<string>('0x');
    const [pending, setPending] = useState<any[]>([]);
    const [txProcessing, setTxProcessing] = useState<boolean>(false);
    const [processingCursor, setProcessingCursor] = useState<number>(0);

    const loadPendingView = async () => {
        
        let {pending, txProcessing, processingCursor} = await pendingView();
        setPending(pending||[]);
        setTxProcessing(txProcessing);
        setProcessingCursor(processingCursor);
        console.log({ pending, txProcessing, processingCursor })
    }
    useEffect(() => {
        loadPendingView();
    }, [mount]);

    const onClickSubmit = async () => {

        let to = toRef.current?.value||'';
        setTo(to);
        setAmount(amountRef.current?.value||'0.');
        if (isToWalletLess) {
            setData( await topupData(toRef.current?.value||''));
        } else {
            setData(dataRef.current?.value||'0x');
        }
        // setTransact({
        //     to: toRef.current?.value||'',
        //     value: parseFloat(amountRef.current?.value||'0.'),
        //     data: isToWalletLess ? await topupData(toRef.current?.value||'') : (dataRef.current?.value||'0x')
        // });
        setAuth(true);
    }


    const [transact, setTransact] = useState<Transact|undefined>(loadTransact());
    const [presetTxHash, setPresetTxHash] = useState<string|undefined>(loadPresetTxHash());
    const [exposeTxHash, setExposeTxHash] = useState<string|undefined>(loadExposeTxHash());

    useEffect(() => {
        storeTransact(transact);
    }, [transact]);
    useEffect(() => {
        storePresetTxHash(presetTxHash||null);
    }, [presetTxHash]);
    useEffect(() => {
        storeExposeTxHash(exposeTxHash||null);
    }, [exposeTxHash]);
    const TRASACT_STEP_0_CREATE = 'TRASACT_STEP_0_CREATE';
    const TRASACT_STEP_1_INIT = 'TRASACT_STEP_1_INIT';
    const TRASACT_STEP_2_PRESET = 'TRASACT_STEP_2_PRESET';
    const TRASACT_STEP_3_PRESET_DONE = 'TRASACT_STEP_3_PRESET_DONE';
    const TRASACT_STEP_3_1_PRESET_FAILED = 'TRASACT_STEP_3_1_PRESET_FAILED';
    const TRASACT_STEP_4_EXPOSE = 'TRASACT_STEP_4_EXPOSE';
    const TRASACT_STEP_5_EXPOSE_DONE = 'TRASACT_STEP_5_EXPOSE_DONE';
    const TRASACT_STEP_5_1_EXPOSE_FAILED = 'TRASACT_STEP_5_1_EXPOSE_FAILED';

    let sv: string|undefined;
    if (exposeTxHash) {
        sv = TRASACT_STEP_4_EXPOSE;
    } else if (presetTxHash) {
        sv = TRASACT_STEP_3_PRESET_DONE;
    } else if (transact) {
        sv = TRASACT_STEP_1_INIT;
    }
    const [step, setStep] = useState<string|undefined>(sv);

    useEffect(() => {
        console.log({to, data});
        if (!to) {
            return;
        }
        (async () => {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 5000);
            })
            if (step === TRASACT_STEP_1_INIT) {
                console.log({to, data, amount, pass})

                let { transaction }: any = await transactPreset(to, amount, data, pass||'',
                    parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas,
                    parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas);
                console.log({transact});
                // setPresetTxHash(transaction.hash);
                // setStep(TRASACT_STEP_2_PRESET)
            } else if (step === TRASACT_STEP_2_PRESET) {
                let { receipt }: any = await Backend.receipt(presetTxHash||'');

                while (!receipt) {
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(true);
                        }, 1000);
                    })
                    let { receipt: r }: any = await Backend.receipt(presetTxHash||'');
                    receipt = r;
                }
                if (receipt.status === 1) {
                    setPresetTxHash(undefined);
                    setStep(TRASACT_STEP_3_PRESET_DONE);
                } else {
                    // TODO failed
                    setStep(TRASACT_STEP_3_1_PRESET_FAILED);
                }

            } else if (step === TRASACT_STEP_3_PRESET_DONE) {
                let { transaction }: any = await transactExpose(pass||'', parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas,
                parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas);
                setStep(TRASACT_STEP_4_EXPOSE);
                setExposeTxHash(transaction.hash);
            } else if (step === TRASACT_STEP_4_EXPOSE) {
                let { receipt }: any = await Backend.receipt(exposeTxHash||'');
                if (receipt) {
                    if (receipt.status === 1) {
                        setExposeTxHash(undefined);
                        setStep(TRASACT_STEP_5_EXPOSE_DONE);
                    } else {
                        // TODO failed
                        setStep(TRASACT_STEP_5_1_EXPOSE_FAILED);
                    }
                }
            }
        })();
    }, [step]);

    const onClickAuth = async () => {
        console.log({to, data, amount})
        setPass(authRef.current?.value||'');
        setStep(TRASACT_STEP_0_CREATE);
        setTimeout(() => {
            setStep(TRASACT_STEP_1_INIT);
        }, 300);
    }

    const [isToContract, setToContract] = useState<boolean>(false);
    const isToContractRef = createRef<HTMLInputElement>();
    const [isToWalletLess, setToWalletless] = useState<boolean>(false);
    const isToWalletLesRef = createRef<HTMLInputElement>();

    const [win, setWin] = useState<number>();
    const onClickCheckExecution = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let win = await checkPending(pass, pending);
        setWin(win);
    }
    
    const onClickExpose = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let expose = await transactExpose(pass,
            parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas,
            parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas);
        console.log({expose});
    }
    
    const onClickExposeCont = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let exposeContTx = await exposeCont(parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas,
            parseInt(maxFeePerGasRef.current?.value||'0')||maxFeePerGas);
        console.log({exposeContTx});
    }
    
    const [editGas, setEditGas] = useState<boolean>(false);
    
    const [maxFeePerGas, setMaxFeePerGas] = useState<number>(40000000000);
    const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<number>(40000000000);

    const maxFeePerGasRef = createRef<HTMLInputElement>();
    const maxPriorityFeePerGasRef = createRef<HTMLInputElement>();

    return <>
        <div>
            {
                !editGas &&
                <>
                    <button onClick={() => setEditGas(true)}>edit gas</button><br />
                </>
            }
            {
                editGas &&
                <>
                    <div>
                        <label><input type={'number'} ref={maxFeePerGasRef} defaultValue={maxFeePerGas} /></label><br />
                        <label><input type={'number'} ref={maxPriorityFeePerGasRef} defaultValue={maxPriorityFeePerGas} /></label><br />
                        <button onClick={() => {
                            if (maxFeePerGasRef.current?.value && parseInt(maxFeePerGasRef.current?.value)) {
                                setMaxFeePerGas(parseInt(maxFeePerGasRef.current?.value));
                            }
                            if (maxPriorityFeePerGasRef.current?.value && parseInt(maxPriorityFeePerGasRef.current?.value)) {
                                setMaxPriorityFeePerGas(parseInt(maxPriorityFeePerGasRef.current?.value));
                            }
                            setEditGas(false);
                        }}>set and close</button>
                    </div><br />
                </>
            }
            {
                pending.length > 0 &&
                <div>
                    {
                        !txProcessing &&
                        <>
                            <input ref={authRef} type={'password'} />
                            {win===undefined && <button onClick={onClickCheckExecution}>check execution</button>}
                            {win!==undefined && <button onClick={onClickExpose}>expose now</button>}
                            <table>
                                {/* <thead> */}
                                    <tr>
                                        <th>to</th>
                                        <th>value</th>
                                        <th>data</th>
                                        <th>cert</th>
                                    </tr>
                                {/* </thead>
                                <tbody> */}
                                    {
                                        pending.map((p:any) => {
                                            return <>
                                                <tr className={win === p.idx ? 'win' : ''}>
                                                    <td>{formatAddress(p.to)}</td>
                                                    <td>{p.value}</td>
                                                    <td>{formatAddress(p.data)}</td>
                                                    <td>{formatAddress(p.cert)}</td>
                                                </tr>
                                            </>;
                                        })
                                    }
                                {/* </tbody> */}
                            </table>   
                        </>
                    }
                    {
                        txProcessing &&
                        <>
                                                        <table>
                                {/* <thead> */}
                                    <tr>
                                        <th>to</th>
                                        <th>value</th>
                                        <th>data</th>
                                        <th>cert</th>
                                    </tr>
                                {/* </thead>
                                <tbody> */}
                                    {
                                        [pending[processingCursor]].map((p:any) => {
                                            return <>
                                                <tr className={'win'}>
                                                    <td>{formatAddress(p.to)}</td>
                                                    <td>{p.value}</td>
                                                    <td>{formatAddress(p.data)}</td>
                                                    <td>{formatAddress(p.cert)}</td>
                                                </tr>
                                            </>;
                                        })
                                    }
                                {/* </tbody> */}
                            </table>
                            <button onClick={onClickExposeCont}>keep processing</button>
                        </>
                    }
                </div>
            }
            {
                !auth &&
                <>
                    To <input type={'text'} ref={toRef} defaultValue={'0x8E1fB6d99E3a9f3B54C498a74985D0b28F6ab6C9'} /><br />
                    Amount <input type={'number'} ref={amountRef} /><br />
                    is wallet-less? <input ref={isToWalletLesRef} onChange={
                        () => setToWalletless(!!(isToWalletLesRef?.current?.checked)) } type={'checkbox'} /><br />
                    with data? <input ref={isToContractRef} onChange={
                        () => setToContract(!!(isToContractRef?.current?.checked)) } type={'checkbox'} /><br />
                    {
                        isToContract &&
                        <>
                            Data <textarea ref={dataRef}></textarea><br />
                        </>
                    }
                    <button onClick={onClickSubmit}>submit</button>
                </>
            }
            {
                auth &&
                <>
                    {presetTxHash &&
                        <>
                            <div>
                                {step === TRASACT_STEP_3_1_PRESET_FAILED &&
                                    <span>failed</span>
                                }
                                step 0/2 <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', presetTxHash)}`}>{formatAddress(presetTxHash)}</a>...
                            </div>
                        </>
                    }
                    {exposeTxHash &&
                        <>
                            <div>
                                step 1/2 <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', exposeTxHash)}`}>{formatAddress(exposeTxHash)}</a>...
                            </div>
                        </>
                    }
                    {
                        step === TRASACT_STEP_5_EXPOSE_DONE &&
                        <>done.</>
                    }
                    Password <input type={'password'} ref={authRef} /><br />
                    <button onClick={onClickAuth}>auth</button>
                </>
            }
        </div>
    </>;
}
export default TransactForm;