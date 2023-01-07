import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatAddress } from "../utils";
import * as walletless from "../walletless";
import * as backend from "../backend";
import DonutChart from "../components/DonutChart";

const logsToActivity = (activity: any[]) => {
    return activity;
}

const Account = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(false);
    const [wallet, setWallet] = useState<walletless.WalletlessState>(walletless.getState());
    const [account, setAccount] = useState<walletless.Account>();
    const [mainBalance, setMainBalance] = useState<walletless.Balance>();
    const [balances, setBalances] = useState<any[]>();
    const [history, setHistory] = useState<any[]>();

    useEffect(() => {
        loadAccount();
    }, [mount, wallet]);

    useEffect(() => {
        if (account?.balances?.length) {
            setMainBalance(account.balances[0]);
            loadHistory();
        }
    }, [account]);


    const loadAccount = async () => {
        if (wallet.account?.address) {
            let account = await backend.getAccount(wallet.account?.address||'');
            setAccount(account);
            let balances = await walletless.getBalances(wallet.account?.address||'');
            setBalances(balances);
        }
    }

    const loadHistory = async () => {
        let history: any = await walletless.getHistory(wallet.account?.address||'');
        setHistory(logsToActivity(history.activities));
    }

    return <>
        <div className="app-window walletless-dashboard">
            <div>
                <div style={{float: 'left'}}>
                    <span>Total balance</span><br />
                    <span>{mainBalance?.balance} {mainBalance?.coin?.symbol}</span>
                </div>
                <div style={{float: 'right'}}>
                    <span>ACCOUNT</span><br />
                    <span>{formatAddress(wallet.account?.address||'')}</span>
                </div>
                <div style={{clear: 'both'}}></div>
            </div>
            <div style={{marginTop: '60px'}}>
                <span>Your assets</span>
                <div style={{float: 'left'}}>
                    { balances && <DonutChart balances={balances} /> }
                </div>
                <div style={{float: 'right'}}>
                    { balances &&
                        balances.map((balance: any) => {
                            return <div><img src={balance.logo} />{balance.usdValue}</div>
                        })
                    }
                </div>
                <div style={{clear: 'both'}}></div>
            </div>
            <div>
                <button onClick={() => navigate('/transfer')}>Send</button>
                <button onClick={() => navigate('/recieve')}>Receive</button>
            </div>
            <div>
                <span>Recent activity</span>
                {history?.length}
                {
                    history &&
                    <table>
                        <thead>
                            <tr>
                                <th></th>
                                <th></th>
                                <th></th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {history?.map((log: any) => {
                                return (<tr>
                                    <td>{log.time}</td>
                                    <td>{log.value}</td>
                                    <td>{log.symbol}</td>
                                    <td>{log.txHash}</td>
                                </tr>)
                            })}
                        </tbody>
                    </table>
                }
            </div>
            <div>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
            </div>
        </div>
        <div className="clear"></div>
    </>;
}
export default Account;