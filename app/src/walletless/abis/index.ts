import {utils} from 'ethers';


export const ERC20Iface = new utils.Interface([

]);

export const walletlessIface = new utils.Interface([

    "event Skip(bytes32 nonce)",
    "event NoneMatches(bytes32 nonce)",
    "event TxDone(bytes32 nonce, address to, uint value, bytes data)",
    "event TxReverted(bytes32 nonce, address to, uint value, bytes data, string message)",
    "event GasStop()",

    // Constructor
    "constructor()",
  
    // State mutating method
    "function init(bytes32 cert, IRGFProvider rgfProvider)",
  
    // State mutating method, which is payable
    // "function getState() public view returns (AccountState memory)",
    "function verifyRecord(uint8 i, bytes32 proof) view returns(bool)",
  
    // Constant method (i.e. "view" or "pure")
    "function preset(address to, uint value, bytes memory data, bytes32 cert) payable",
  
    // An Event
    "function expose(bytes32 proof, uint skip)",
  
    // A Custom Solidity Error
    "function exposeCont()",
  
    // Examples with structured types
    "function resetCert(bytes32 cert)",
    "function setRGFProvider(address rgfProvider)",
  ]);