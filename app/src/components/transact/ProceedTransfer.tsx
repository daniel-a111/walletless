import { createRef, FC, useState } from "react";
import { checkPending, exposeCont, transactExpose } from "../../account/Account";
import PendingTable from "./../transact/PendingTable";

interface IProps {
    gasMethod: string;
    pending: any[];
    txProcessing: boolean;
    processingCursor: number;
}

const ProceedTransfer: FC<IProps>  = ({ gasMethod, pending, txProcessing, processingCursor }) => {

    const [mount] = useState<boolean>(true);
    const [win, setWin] = useState<number>();
    const [isCheckExecutionLoading, setCheckExecutionLoading] = useState<boolean>(false);
    const authRef = createRef<HTMLInputElement>();

    const onClickExposeCont = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let exposeContTx = await exposeCont();
        console.log({exposeContTx});
    }
    const onClickExpose = async () => {
        let pass = authRef.current?.value||'';
        console.log({pass});
        let expose = await transactExpose(pass);
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