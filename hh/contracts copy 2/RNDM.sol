pragma solidity ^0.8.9;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RNDM is ERC20, Ownable {

    constructor() ERC20("Random", "RNDM") {
    }

    function mint(address account, uint256 amount) onlyOwner external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) onlyOwner external {
        _burn(account, amount);
    }
}