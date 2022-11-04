import { createRef, useState } from "react";
import { checkPending, exposeCont, transactExpose } from "../../account/Account";
import PendingTable from "./../transact/PendingTable";

const ProceedTransfer = ({ maxFeePerGas, maxPriorityFeePerGas, pending, txProcessing, processingCursor }: any) => {

    const [mount] = useState<boolean>(true);
    const [win, setWin] = useState<number>();
    const [isCheckExecutionLoading, setCheckExecutionLoading] = useState<boolean>(false);
    const authRef = createRef<HTMLInputElement>();

    const onClickExposeCont = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let exposeContTx = await exposeCont(maxFeePerGas, maxPriorityFeePerGas);
        console.log({exposeContTx});
    }
    const onClickExpose = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let expose = await transactExpose(pass,
            maxFeePerGas,
            maxPriorityFeePerGas);
        console.log({expose});
    }
    const onClickCheckExecution = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        setCheckExecutionLoading(true);
        try {
            let win = await checkPending(pass, pending);
            console.log({win});
            setCheckExecutionLoading(false);
            setWin(win);
        } catch (error: any) {
            setCheckExecutionLoading(false);
            throw error;
        }
    }
    
    return <>
            {
                pending.length > 0 &&
                <div>
                {
                    !txProcessing &&
                    <>
                        <input ref={authRef} type={'password'} />
                        {win===undefined &&
                            <>
                                {
                                    isCheckExecutionLoading &&
                                    <>
                                        Checking...
                                    </>
                                }
                                <button onClick={onClickCheckExecution}>check execution</button>
                            </>
                        }
                        {win!==undefined &&
                            <>
                                <button onClick={onClickExpose}>expose now</button>
                            </>
                        }
                        <PendingTable pending={pending} win={win} />
                    </>
                }
                {
                    txProcessing &&
                    <>
                        <PendingTable pending={[pending[processingCursor]]} win={(win||0)-processingCursor} />
                        <button onClick={onClickExposeCont}>keep processing</button>
                    </>
                }
            </div>
        }
    </>;
}
export default ProceedTransfer;