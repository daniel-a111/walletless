import { copyToClipboard, formatAddress } from "../../utils";

const PendingTable = ({ pending, win }: any) => {
    console.log({pending, win});
    return <>
        <table>
            <tr>
                <th>to</th>
                <th>value</th>
                <th>data</th>
                <th>cert</th>
            </tr>
            {
                pending.map((p:any, i: number) => {
                    return <>
                        <tr className={win === i ? 'win' : ''}>
                            <td onClick={copyToClipboard} data-copy={p.to}>{formatAddress(p.to)}</td>
                            <td>{p.value}</td>
                            <td onClick={copyToClipboard} data-copy={p.data}>{formatAddress(p.data)}</td>
                            <td onClick={copyToClipboard} data-copy={p.cert}>{formatAddress(p.cert)}</td>
                        </tr>
                    </>;
                })
            }
        </table>
    </>;
}
export default PendingTable;