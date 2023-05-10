// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexV1PairNative.sol';
import "./interfaces/IMDexLiquidityManager.sol";
import "./libs/Liquidity.sol";
import "hardhat/console.sol";


contract MDexV1PairNative is  HyperlaneConnectionClient, IMDexV1PairNative {

    //Events
    event Swap(address indexed to, uint amountIn, uint amountOut);
    event Sync(uint reserve1, uint reserve2);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;
    using Liquidity for Liquidity.Map;

    //store open positions in mapping and array, with counter to track them
    uint public positionCounter = 0;
    mapping(uint => LiquidityToken) public positions;
    mapping(address => uint) public pendingPosition;
    Liquidity.Map private myPendingPositions;
    uint[] public openPositionArray;

    // using iterable mapping to store positions
    Liquidity.Map private myOpenedPositions;
    Liquidity.Map private myClosedPositions;

    address public factory;
    address public remoteAddress;

    uint8 public constant FEE = 1;
    uint8 public constant PERCENT = 100;

    uint32 public LOCAL_DOMAIN;
    uint32 public REMOTE_DOMAIN;

    uint public reserve1;       
    uint public reserve2;  

    uint public investment1;       
    uint public investment2;  

    uint public kValue;          
    uint32 private blockTimestampLast; 


    uint private unlocked = 1;

    // Modifiers
    modifier lock() {
        require(unlocked == 1, 'MDEX: LOCKED');
        unlocked = 0;
        _;
        unlocked = 1;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert('MDEX: ONLY FACTORY');
        _;
    }

    constructor(uint32 _LOCAL_DOMAIN, uint32 _REMOTE_DOMAIN, address _remoteAddress, address _factory) {
        remoteAddress = _remoteAddress;
        factory = _factory;
        LOCAL_DOMAIN = _LOCAL_DOMAIN;
        REMOTE_DOMAIN = _REMOTE_DOMAIN;
    }

    function getReserves() public view returns (uint _reserve1, uint _reserve2, uint32 _blockTimestampLast) {
        _reserve1 = reserve1;
        _reserve2 = reserve2;
        _blockTimestampLast = blockTimestampLast;
    }

    function generateId(address _sender) external view returns (bytes32) {
        return keccak256(abi.encodePacked(_sender, positionCounter));
    }

    function getPosition(uint _tokenId) external view returns (LiquidityToken memory) {
        return positions[_tokenId];
    }

    function getPositions() external view returns (uint) {
        return positionCounter;
    }

    function collectFee(uint _positionId) public lock {
        LiquidityToken storage myPosition = positions[_positionId];
        if (myPosition.owner != msg.sender) revert("MDEX: NOT OWNER");
        uint fee = myPosition.availableFees;
        myPosition.availableFees = 0;
        (bool success,) = payable(msg.sender).call{value: fee}("");
        if (!success) revert("MDEX: TRANSACTION FAIL");
    }

    function initialize(address _mailbox, address _interchainGasPaymaster) external initializer() {
        __HyperlaneConnectionClient_initialize(
            _mailbox, 
            _interchainGasPaymaster
        );
    }

    function getPrice(uint _amountIn) public view returns(uint) {
        return (reserve1 * _amountIn) / (_amountIn + reserve2);
    }

    function _getGas(uint _amount) internal view returns(uint) {
        return msg.value - _amount;
    }

    function addLiquidityCore(bytes32 id, uint amountIn1, uint amountIn2, address sender, bool isPaying) external onlyFactory returns (uint) {

        if (pendingPosition[sender] == 0) {
            positionCounter++;
            positions[positionCounter] = LiquidityToken(id, 0, 0, amountIn1, amountIn2, isPaying, sender, positionCounter);
            
            myPendingPositions.add(sender, positionCounter);
            pendingPosition[sender] = positionCounter;

            return positionCounter;

        } else {

            uint currentPosition = pendingPosition[sender];

            if (isPaying) positions[currentPosition].paid = true;

            // Adding to liquidity and removing from pending
            openPositionArray.push(currentPosition);
            myOpenedPositions.add(sender, currentPosition);
            myPendingPositions.remove(sender, currentPosition);
            reserve1 += positions[currentPosition].amountIn1;
            reserve2 += positions[currentPosition].amountIn2;

            investment1 += positions[currentPosition].amountIn1;
            investment2 += positions[currentPosition].amountIn2;

            //pricing             
            kValue = (reserve1) * (reserve2);

            delete pendingPosition[sender];

            return currentPosition;
        }

    }

    function getPendingPositionsByAddress(address _owner) external view returns(LiquidityToken[] memory) {
        
        uint[] memory myPositions = myPendingPositions.get(_owner);

        LiquidityToken[] memory output = new LiquidityToken[](myPositions.length);

        for (uint i = 0; i < myPositions.length;) {

            output[i] = positions[myPositions[i]];

            unchecked {
                ++i;
            }

        }

        return output;
    }

    function getOpenedPositionsByAddress(address _owner) external view returns(LiquidityToken[] memory) {
        
        uint[] memory myPositions = myOpenedPositions.get(_owner);

        LiquidityToken[] memory output = new LiquidityToken[](myPositions.length);

        for (uint i = 0; i < myPositions.length;) {

            output[i] = positions[myPositions[i]];

            unchecked {
                ++i;
            }

        }

        return output;
    }

    function getClosedPositionsByAddress(address _owner) external view returns(LiquidityToken[] memory) {
        
        uint[] memory myPositions = myClosedPositions.get(_owner);

        LiquidityToken[] memory output = new LiquidityToken[](myPositions.length);

        for (uint i = 0; i < myPositions.length;) {

            output[i] = positions[myPositions[i]];

            unchecked {
                ++i;
            }
            
        }

        return output;
    }

    function removeLiquidityCore(uint _position, address _owner) external onlyFactory returns(bytes32) {
        
        LiquidityToken memory position = positions[_position];

        //Liquidity.Map private myPendingPositions;

        // Removing it from opened positons and adding to closed
        // console.log(_position);
        // openPositionArray[_position] = openPositionArray[openPositionArray.length - 1];
        // openPositionArray.pop();

  
        // using iterable mapping to store positions
        //myOpenedPositions.get(_position);
        //Liquidity.Map private myClosedPositions;

        delete positions[_position];

        uint percent =  investment1 / position.amountIn1;

        investment1 -= position.amountIn1;

        uint payout = reserve1 / percent;

        reserve1 -= reserve1;

        (bool success, ) = payable(_owner).call{value: payout}("");

        if (!success) revert("MDEX: TRANSACTION FAILED");

        return position.id;

    }

    function swapCore(uint _amountIn, address _to) external onlyFactory returns (uint amountOut) {

        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings

        amountOut = getPrice(_amountIn); // get ouput
   
        if (_amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        uint fee = payerInvestor(_amountIn);

        reserve1 += _amountIn - fee;

        reserve2 -= amountOut;

        emit Swap(_to, _amountIn, amountOut);
    }

    function swapPay(uint _amountIn, uint _amountOut, address _to) external onlyFactory {
        (bool success, ) = payable(_to).call{value: _amountOut}("MDEX: SWAP_SUCCESSFUL");
        uint fee = (_amountIn * FEE) / PERCENT; 
        reserve1 -= _amountOut;
        reserve2 += _amountIn - fee;
        if (!success) revert("MDEX: SWAP_FAILED");
    }

    function payerInvestor(uint _amountIn) internal returns (uint) {

        uint fee = (_amountIn * FEE) / PERCENT; 

        for (uint i = 1; i <= openPositionArray.length;) {

            LiquidityToken storage position = positions[i];
            
            uint payOut = (position.amountIn1 * fee) / reserve1;

            position.availableFees += payOut;

            position.totalFees += payOut;

            unchecked {
                ++i;
            }
        }

        return fee;

    }

    receive() external payable {}

    fallback() external payable {}

}
