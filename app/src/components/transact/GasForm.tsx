import { createRef, useEffect, useState } from "react";
import * as Backend from "../../backend";


export const METHOD_STANDARD = 'standard';
export const METHOD_FAST = 'fast';
export const METHOD_RAPID = 'rapid';
const GasForm = ({ onPickMethod }: any) => {

    const [mount, setMount] = useState<boolean>(true);
    const [editGas, setEditGas] = useState<boolean>(false);
    const [gasMarket, setGasMarket] = useState<any>();

    const standardRef = createRef<HTMLInputElement>();
    const fastRef = createRef<HTMLInputElement>();
    const rapidRef = createRef<HTMLInputElement>();

    const getGasMarket = async () => {
        let {gasMarket}: any = await Backend.getGasMarket();
        if (gasMarket) {
            setGasMarket(gasMarket);
        }
        setTimeout(getGasMarket, 1000);
    }

    useEffect(() => {
        getGasMarket();
    }, [mount]);

    const onPickSetMethod = () => {
        if (standardRef.current?.checked) {
            setMethod(METHOD_STANDARD)
        } else if (fastRef.current?.checked) {
            setMethod(METHOD_FAST);
        } else if (rapidRef.current?.checked) {
            setMethod(METHOD_RAPID);
        }
    }
    const [method, setMethod] = useState<string>('standard');
    useEffect(() => {
        onPickMethod(method);
    }, [method]);
    return <>
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
                    <label>{ gasMarket.standard }<input onClick={onPickSetMethod} type={'radio'} name={'method'} ref={standardRef} defaultChecked={true} />Standard</label><br />
                    <label>{ gasMarket.fast }<input onClick={onPickSetMethod} type={'radio'} name={'method'} ref={fastRef} />Fast</label><br />
                    <label>{ gasMarket.rapid }<input onClick={onPickSetMethod} type={'radio'} name={'method'} ref={rapidRef} />Rapid</label><br />
                    <button style={{float: 'left'}} onClick={() => {
                        setEditGas(false);
                    }}>set and close</button>
                </div><br />
            </>
        }
    </>;
}
export default GasForm;