import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// import { getCurrentToken, Token } from "../services/TokenManager";
import AppHeader from "./AppHeader";
// import { getNetwork, Network } from "../services/Network";
// import { listSafes } from "../services/Activities";
import { formatAddress, formatBalance, formatDate } from "../utils";

const Nav = () => {

    const [mount] = useState<boolean>(true);
    // const [safes, setSafes] = useState<any[]>([]);
    // const [network, setNetwork] = useState<Network>();
    // const [token, setToken] = useState<Token>();

    // const loadCurrentToken = async () => {
    //     setToken(await getCurrentToken());
    // }

    // useEffect(() => {
    //     loadCurrentToken();
    // }, [mount]);

    // const loadNetwork = async () => {
    //     let network = await getNetwork();
    //     setNetwork(network);
    // }

    // useEffect(() => {
    //     loadNetwork();
    // }, [mount]);

    // const loadSafes = async () => {
    //     setSafes(await listSafes());
    // }

    // useEffect(() => {
    //     if (network) {
    //         loadSafes();
    //     }
    // }, [network]);

        
    return <div className="nav">
        <div className="content">
            <div className="timelock-logo">WalletLess</div>
            <a className="btn-launch-app">Launch App</a>
            <a>Donate</a>
            <a>About</a>
            <a>Learn</a>
            <a>Premium</a>
        </div>
    </div>;
}
export default Nav;