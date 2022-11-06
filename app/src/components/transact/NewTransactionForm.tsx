import { createRef, useEffect, useState } from "react";
import { transactExpose, transactPreset } from "../../account/Account";
import { topupData } from "../../contracts";
import { loadExposeTxHash, loadPresetTxHash, loadTransact, storeExposeTxHash, storePresetTxHash, storeTransact, Transact } from "../../account/storage";
import * as Backend from "../../backend";

const TRASACT_STEP_0_CREATE = 'TRASACT_STEP_0_CREATE';
const TRASACT_STEP_1_PRESET = 'TRASACT_STEP_1_PRESET';
const TRASACT_STEP_2_PRESET_PROCESSING = 'TRASACT_STEP_2_PRESET_PROCESSING';
const TRASACT_STEP_3_PRESET_DONE = 'TRASACT_STEP_3_PRESET_DONE';
const TRASACT_STEP_3_1_PRESET_FAILED = 'TRASACT_STEP_3_1_PRESET_FAILED';
const TRASACT_STEP_4_EXPOSE = 'TRASACT_STEP_4_EXPOSE';
const TRASACT_STEP_5_EXPOSE_PROCESSING = 'TRASACT_STEP_5_EXPOSE_PROCESSING';
const TRASACT_STEP_5_EXPOSE_DONE = 'TRASACT_STEP_5_EXPOSE_DONE';
const TRASACT_STEP_5_1_EXPOSE_FAILED = 'TRASACT_STEP_5_1_EXPOSE_FAILED';

const NewTransactionForm = ({ maxFeePerGas, maxPriorityFeePerGas }: any) => {

    const [mount] = useState<boolean>(true);
    const [auth, setAuth] = useState<boolean>(false);
    const [to, setTo] = useState<string>('');
    const [amount, setAmount] = useState<string>('0');
    const [data, setData] = useState<string>('0x');
    const [pass, setPass] = useState<string>('0x');

    const [transact, setTransact] = useState<Transact|undefined>(loadTransact());
    const [presetTxHash, setPresetTxHash] = useState<string|undefined>(loadPresetTxHash());
    const [exposeTxHash, setExposeTxHash] = useState<string|undefined>(loadExposeTxHash());

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
                console.log({start: new Date()});
                for (let i = 1; i <= 4; i++) {
                    setTimeout(() => {
                        console.log({start: new Date(), left: (4-i)*5000});
                    }, 5000*i);
                }
                setTimeout(() => {
                    resolve(true);
                }, 20000);
            })
            console.log({step});

            if (step === TRASACT_STEP_1_PRESET) {
                console.log({to, data, amount, pass})

                let { transaction }: any = await transactPreset(to, amount, data, pass||'');
                console.log({transact});
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
                let txMaxFeePerGas = maxFeePerGas;
                let txMaxPriorityFeePerGas = maxPriorityFeePerGas;
                let { transaction }: any = await transactExpose(pass||'');
                console.log({ transaction });
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
            setStep(TRASACT_STEP_1_PRESET);
        }, 300);
    }

    const [isToContract, setToContract] = useState<boolean>(false);
    const isToContractRef = createRef<HTMLInputElement>();
    const [isToWalletLess, setToWalletless] = useState<boolean>(false);
    const isToWalletLesRef = createRef<HTMLInputElement>();
    const [isLoadingPending, setLoadingPending] = useState<boolean>(false);    
    // const [maxFeePerGas, setMaxFeePerGas] = useState<number>(40000000000);
    // const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState<number>(40000000000);

    return <>
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
    </>;
}
export default NewTransactionForm;