import { createRef, useState } from "react";

const GasForm = ({ maxFeePerGas, maxPriorityFeePerGas, setMaxFeePerGas, setMaxPriorityFeePerGas }: any) => {
    const [editGas, setEditGas] = useState<boolean>(false);
    const maxFeePerGasRef = createRef<HTMLInputElement>();
    const maxPriorityFeePerGasRef = createRef<HTMLInputElement>();

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
                    <label><input type={'number'} ref={maxFeePerGasRef} defaultValue={maxFeePerGas} /></label><br />
                    <label><input type={'number'} ref={maxPriorityFeePerGasRef} defaultValue={maxPriorityFeePerGas} /></label><br />
                    <button style={{float: 'left'}} onClick={() => {
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
    </>;
}
export default GasForm;