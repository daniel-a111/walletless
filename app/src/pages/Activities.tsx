import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatAddress, formatDate } from "../utils";
import * as walletless from "../walletless";
import * as backend from "../backend";
import DonutChart from "../components/DonutChart";
import { walletlessIface } from "../walletless/abis";
import { BigNumber, ethers } from "ethers";

const logsToActivity = (activity: any[]) => {
    return activity;
}

const Activities = () => {
    let navigate = useNavigate();

    const [mount] = useState<boolean>(false);
    const [wallet] = useState<walletless.WalletlessState>(walletless.getState());
    const [account, setAccount] = useState<walletless.Account>();
    const [mainBalance, setMainBalance] = useState<walletless.Balance>();
    const [balances, setBalances] = useState<any[]>();
    const [history, setHistory] = useState<any[]>();
    const [activities, setActivities] = useState<any[]>();

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

    const enrichWithTransfer = (coinsMapByAddress: any, mainCoin: any, activity: any) => {
        let to = activity.to;
        let coin = coinsMapByAddress[to];
        console.log({coinsMapByAddress})
        if (!coin) {
            if (ethers.utils.parseEther(activity.value).gt(0)) {
                let to = activity.to;
                let amount = activity.value;
                let symbol = mainCoin.symbol;
                let logo = mainCoin.logo;

                activity.transfer = {
                    to, amount, symbol, logo
                }
            }
            if (activity.data.startsWith("0xefc54eb7")) {
                activity.description = 'Reset Password';
            }
        } else if (coin && activity.data.startsWith("0xa9059cbb000000000000000000000000")) {
            let to = activity.data.substring("0xa9059cbb000000000000000000000000".length, "0xa9059cbb000000000000000000000000".length+40);
            let amount = ethers.utils.formatEther(BigNumber.from('0x'+activity.data.substring("0xa9059cbb000000000000000000000000".length+40+1)));
            let symbol = coin.symbol;
            let logo = coin.logo;
            activity.transfer = {
                to, amount, symbol, logo
            }
        }
    }

    const loadHistory = async () => {
        
        let history: any = await walletless.getHistory(wallet.account?.address||'');
        setHistory(logsToActivity(history.activities));
        let {activities}: any = await walletless.getActivities(wallet.account?.address||'');
        let coins = await walletless.getBalances(wallet.account?.address||'');
        console.log({coins});
        let coinsMapByAddress: any = {};
        let mainCoin: any;
        for (let coin of coins) {
            if (coin.address) {
                coinsMapByAddress[coin.address] = coin;
            } else {
                mainCoin = coin;
            }
        }
        for (let activity of activities) {
            if (activity.event === 'TxDone' || activity.event === 'TxReverted') {
                enrichWithTransfer(coinsMapByAddress, mainCoin, activity);
            }
        }
        setActivities(activities);
        console.log({activities})
    }


    const coinSymbolToLogo = (symbol: string) => {
        return balances?.find((c: any) => c.symbol === symbol)?.logo;
    }

    return <>
        <div className="app-window walletless-dashboard">
            {
                activities &&
                <>
                    {activities.map((activity: any) => {
                        return <>
                            <div>
                                <span style={{background: '#dadada', marginRight: '20px'}}>{formatDate(new Date(activity.createdAt).getTime()/1000)}</span>
                                {formatAddress(activity.nonce)} {activity.event}<br />
                                {activity.transfer &&
                                    <>
                                        {formatAddress(activity.transfer.to)} {activity.transfer.amount} {activity.transfer.symbol} <img src={coinSymbolToLogo(activity.transfer.symbol)} />
                                    </>
                                }
                                {
                                    !activity.transfer &&
                                    <>
                                        Contract {formatAddress(activity.to)}<br />
                                        {
                                            activity.value !== '0.0' &&
                                            <>
                                                Value {activity.value} {mainBalance?.coin.symbol}<br />
                                            </>
                                        }
                                        Data {activity.data}
                                        {
                                            activity.description &&
                                            <>
                                                Method {activity.description}
                                            </>
                                        }
                                    </>
                                }
                            </div><br /><br />
                        </>
                    })}
                </>
            }
        </div>
        <div className="clear"></div>
    </>;
}
export default Activities;