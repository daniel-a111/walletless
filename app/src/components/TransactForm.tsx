import { createRef, useEffect, useState } from "react";
import { formatAddress } from "../utils";
import { getAccount, transactExpose, transactPreset } from "../account/Account";
import { topupData } from "../contracts";
import { loadExposeTxHash, loadPresetTxHash, loadTransact, storeExposeTxHash, storePresetTxHash, storeTransact, Transact } from "../account/storage";
import * as Backend from "../backend";
import config from "../config";
import GasForm, { METHOD_STANDARD } from "./transact/GasForm";
import ProceedTransfer from "./transact/ProceedTransfer";

const TRASACT_STEP_0_CREATE = 'TRASACT_STEP_0_CREATE';
const TRASACT_STEP_1_PRESET = 'TRASACT_STEP_1_PRESET';
const TRASACT_STEP_2_PRESET_PROCESSING = 'TRASACT_STEP_2_PRESET_PROCESSING';
const TRASACT_STEP_3_PRESET_DONE = 'TRASACT_STEP_3_PRESET_DONE';
const TRASACT_STEP_3_1_PRESET_FAILED = 'TRASACT_STEP_3_1_PRESET_FAILED';
const TRASACT_STEP_4_EXPOSE = 'TRASACT_STEP_4_EXPOSE';
const TRASACT_STEP_5_EXPOSE_PROCESSING = 'TRASACT_STEP_5_EXPOSE_PROCESSING';
const TRASACT_STEP_5_EXPOSE_DONE = 'TRASACT_STEP_5_EXPOSE_DONE';
const TRASACT_STEP_5_1_EXPOSE_FAILED = 'TRASACT_STEP_5_1_EXPOSE_FAILED';

const TransactForm = () => {

    const [mount] = useState<boolean>(true);
    const [auth, setAuth] = useState<boolean>(false);
    const [to, setTo] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [data, setData] = useState<string>('0x');
    const [pass, setPass] = useState<string>('0x');

    const [transact, setTransact] = useState<Transact|undefined>(loadTransact());
    const [presetTxHash, setPresetTxHash] = useState<string|undefined>(loadPresetTxHash());
    const [exposeTxHash, setExposeTxHash] = useState<string|undefined>(loadExposeTxHash());
    const [txProcessing, setTxProcessing] = useState<boolean>(false);
    const [processingCursor, setProcessingCursor] = useState<number>(0);
    const [pending, setPending] = useState<any[]>([]);

    let sv: string|undefined;
    if (exposeTxHash) {
        sv = TRASACT_STEP_5_EXPOSE_PROCESSING;
    } else if (presetTxHash) {
        sv = TRASACT_STEP_2_PRESET_PROCESSING;
    } else if (transact) {
        sv = TRASACT_STEP_1_PRESET;
    }
    const [step, setStep] = useState<string|undefined>(sv);

    const toRef = createRef<HTMLInputElement>();
    const amountRef = createRef<HTMLInputElement>();
    const dataRef = createRef<HTMLTextAreaElement>();
    const authRef = createRef<HTMLInputElement>();

    const loadPendingView = async () => {
        
        setLoadingPending(true);
        let {pending, txProcessing, processingCursor} = await getAccount();
        setLoadingPending(false);
        setPending(pending||[]);
        setTxProcessing(txProcessing);
        setProcessingCursor(processingCursor);
        console.log({ pending, txProcessing, processingCursor })
    }
    useEffect(() => {
        loadPendingView();
    }, [mount]);
    useEffect(() => {
        console.log({pending});
    }, [pending]);

    const onClickSubmit = async () => {
        let to = toRef.current?.value||'';
        setTo(to);
        setAmount(amountRef.current?.value||'0.');
        if (isToWalletLess) {
            setData( await topupData(toRef.current?.value||''));
        } else {
            setData(dataRef.current?.value||'0x');
        }
        setAuth(true);
    }

    useEffect(() => {
        storeTransact(transact);
    }, [transact]);
    useEffect(() => {
        storePresetTxHash(presetTxHash||null);
    }, [presetTxHash]);
    useEffect(() => {
        storeExposeTxHash(exposeTxHash||null);
    }, [exposeTxHash]);

    useEffect(() => {
        console.log({to, data});
        if (!to && !presetTxHash && !exposeTxHash) {
            return;
        }
        (async () => {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 2000);
            })

            if (step === TRASACT_STEP_1_PRESET) {
                let { transaction }: any = await transactPreset(to, amount, data, pass||'');
                setPresetTxHash(transaction.hash);
                setStep(TRASACT_STEP_2_PRESET_PROCESSING)
            } else if (step === TRASACT_STEP_2_PRESET_PROCESSING) {
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
            } else if (step === TRASACT_STEP_3_PRESET_DONE && pass) {
                setStep(TRASACT_STEP_4_EXPOSE);
            } else if (step === TRASACT_STEP_4_EXPOSE) {
                let { transaction }: any = await transactExpose(pass||'');
                setExposeTxHash(transaction.hash);
                setStep(TRASACT_STEP_5_EXPOSE_PROCESSING);
            } else if (step === TRASACT_STEP_5_EXPOSE_PROCESSING) {
                let { receipt }: any = await Backend.receipt(exposeTxHash||'');
                while (!receipt) {
                    await new Promise((resolve) => {
                        setTimeout(() => {
                            resolve(true);
                        }, 1000);
                    })
                    let { receipt: r }: any = await Backend.receipt(exposeTxHash||'');
                    receipt = r;
                }
                if (receipt.status === 1) {
                    setExposeTxHash(undefined);
                    setStep(TRASACT_STEP_5_EXPOSE_DONE);
                } else {
                    // TODO failed
                    setStep(TRASACT_STEP_5_1_EXPOSE_FAILED);
                }
            } else if ( step === TRASACT_STEP_5_EXPOSE_DONE ) {}
        })();
    }, [step]);

    const onClickAuth = async () => {
        console.log({to, data, amount})
        setPass(authRef.current?.value||'');
        setStep(TRASACT_STEP_0_CREATE);
        setTimeout(() => {
            setStep(TRASACT_STEP_1_PRESET);
        }, 300);
    }

    const [isToContract, setToContract] = useState<boolean>(false);
    const isToContractRef = createRef<HTMLInputElement>();
    const [isToWalletLess, setToWalletless] = useState<boolean>(false);
    const isToWalletLesRef = createRef<HTMLInputElement>();

    const [isLoadingPending, setLoadingPending] = useState<boolean>(false);
    const stageNewRef = createRef<HTMLInputElement>();
    const stageProceedRef = createRef<HTMLInputElement>();

    const STAGE_NEW = 'STAGE_NEW';
    const STAGE_PROCEED = 'STAGE_PROCEED';
    const [stage, setStage] = useState<string>(STAGE_NEW);
    const onStageChange = () => {
        if (stageNewRef.current?.checked) {
            setStage(STAGE_NEW);
        } else {
            setStage(STAGE_PROCEED);
        }
    }

    const [gasMethod, setGasMethod] = useState<string>(METHOD_STANDARD);
    const onPickMethod = (method: string) => {
        setGasMethod(method);
    }

    return <>
        <div>
            <div>
                <label>new transfer<input
                    onClick={onStageChange}
                    defaultChecked={true} ref={stageNewRef} name={'transfer-stage'} type={'radio'} /></label>
                <label>proceed transfer<input
                    onClick={onStageChange}
                    ref={stageProceedRef} disabled={!pending || pending.length === 0} name={'transfer-stage'} type={'radio'} /></label>
            </div>
            {step}<br /><br />
            {
                step === TRASACT_STEP_1_PRESET &&
                <>
                    authenticate...<br /><br />
                </>
            }
            { presetTxHash &&
                <>
                    <div style={{marginBottom: '40px', fontSize: '12px'}}>
                        step 1/2 on tx <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', presetTxHash)}`}>{formatAddress(presetTxHash)}</a>...
                    </div>
                </>
            }
            { exposeTxHash &&
                <>
                    <div style={{marginBottom: '40px', fontSize: '12px'}}>
                        step 2/2 on tx <a target={'_blank'} href={`${config.TX_INFO_URL.replaceAll('{hash}', exposeTxHash)}`}>{formatAddress(exposeTxHash)}</a>...
                    </div>
                </>
            }
            {
                isLoadingPending &&
                <>
                    looking for pendings...<br /><br />
                </>
            }
            {
                stage === STAGE_PROCEED &&
                <>
                    <ProceedTransfer gasMethod={gasMethod}
                                    pending={pending}
                                    txProcessing={txProcessing} processingCursor={processingCursor}
                                    />
                </>
            }
            {
                stage === STAGE_NEW &&
                <>
                    {
                        !auth &&
                        <>
                            To <input type={'text'} ref={toRef} placeholder={'for example 0x8E1fB6...'} /><br />
                            Amount <input type={'number'} ref={amountRef} placeholder={'0.0'} /><br />
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
                            <button disabled={isLoadingPending} onClick={onClickSubmit}>submit</button>
                        </>
                    }
                    {
                        auth &&
                        <>
                            {
                                step === TRASACT_STEP_5_EXPOSE_DONE &&
                                <>done.<br /></>
                            }
                            Password <input type={'password'} ref={authRef} /><br />
                            <button onClick={onClickAuth}>auth</button>
                        </>
                    }
                </>
            }
            {/* <GasForm onPickMethod={onPickMethod} /> */}
        </div>
    </>;
}
export default TransactForm;