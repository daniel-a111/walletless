pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RNDM is ERC20 {

    address owner;
    constructor() ERC20("Random", "RNDM") {
        owner = msg.sender;
    }

    function mint(address account, uint256 amount) external {
        require(msg.sender==owner, "Owner only");
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        require(msg.sender==owner, "Owner only");
        _burn(account, amount);
    }
}