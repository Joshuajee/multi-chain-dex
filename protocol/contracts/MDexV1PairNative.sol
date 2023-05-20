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

    uint public constant MINIMUM_LIQUIDITY = 0.0000001 ether;

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

    modifier onlyFactory() {
        if (msg.sender != factory) revert('MDEX: ONLY FACTORY');
        _;
    }

    function init(uint32 _LOCAL_DOMAIN, uint32 _REMOTE_DOMAIN, address _remoteAddress, address _factory) external initializer()  {
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

    function collectFee(uint _positionId) public {
        LiquidityToken storage myPosition = positions[_positionId];
        if (myPosition.owner != msg.sender) revert("MDEX: NOT OWNER");
        uint fee = myPosition.availableFees;
        myPosition.availableFees = 0;
        (bool success,) = payable(msg.sender).call{value: fee}("");
        if (!success) revert("MDEX: TRANSACTION FAIL");
    }

    function initialize(uint32 _LOCAL_DOMAIN, uint32 _REMOTE_DOMAIN, address _remoteAddress, address _factory, address _mailbox, address _interchainGasPaymaster) external initializer() {
        __HyperlaneConnectionClient_initialize(
            _mailbox, 
            _interchainGasPaymaster
        );

        remoteAddress = _remoteAddress;
        factory = _factory;
        LOCAL_DOMAIN = _LOCAL_DOMAIN;
        REMOTE_DOMAIN = _REMOTE_DOMAIN;
    }

    function getPrice(uint _amountIn) public view returns(uint) {
        return (reserve2 * _amountIn) / (_amountIn + reserve1);
    }

    function _getGas(uint _amount) internal view returns(uint) {
        return msg.value - _amount;
    }

    function addLiquidityCore(bytes32 id, uint amountIn1, uint amountIn2, uint32 remoteDomain, address sender, bool isPaying) external onlyFactory returns (uint) {

        if (pendingPosition[sender] == 0) {
            positionCounter++;
            positions[positionCounter] = LiquidityToken(id, 0, 0, amountIn1, amountIn2, isPaying, sender, positionCounter, remoteDomain);
            
            myPendingPositions.add(sender, positionCounter);
            pendingPosition[sender] = positionCounter;

            return positionCounter;

        } else {

            uint currentPosition = pendingPosition[sender];

            uint _amountIn1 = positions[currentPosition].amountIn1;
            uint _amountIn2 = positions[currentPosition].amountIn2;

            if (isPaying) {
                if (positions[currentPosition].paid) revert("MDEX: ALREADY PAID");
                if (amountIn1 < _amountIn1) revert("MDEX: AMOUNT TOO SMALL");
                positions[currentPosition].paid = true;
            }

            // Adding to liquidity and removing from pending
            openPositionArray.push(currentPosition);
            myOpenedPositions.add(sender, currentPosition);
            myPendingPositions.remove(sender, currentPosition);

            reserve1 +=  _amountIn1;
            reserve2 += _amountIn2;

            investment1 += _amountIn1;
            investment2 += _amountIn2;

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

    function removeLiquidityCore(uint _position, address _owner) external onlyFactory returns(bytes32, bool) {
        
        LiquidityToken memory position = positions[_position];

        uint payout = (position.amountIn1 * reserve1) / investment1;
        uint payout2 = (position.amountIn2 * reserve2) / investment2;

        investment1 -= position.amountIn1;
        investment2 -= position.amountIn2;

        reserve1 -= payout;
        reserve2 -= payout2;

        (bool success, ) = payable(_owner).call{value: payout}("");

        if (investment1 == 0 || investment2 == 0) return (position.id, true);

        if (!success) revert("MDEX: TRANSACTION FAILED");

        delete positions[_position];

        return (position.id, false);

    }

    function swapCore(uint _amountIn, address _to) external onlyFactory returns (uint amountOut) {

        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings

        amountOut = getPrice(_amountIn); // get ouput
   
        if (_amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        uint fee = payInvestors(_amountIn);

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

    function payInvestors(uint _amountIn) internal returns (uint) {

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
