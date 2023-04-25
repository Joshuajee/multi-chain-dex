// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexV1PairNative.sol';
import "./interfaces/IMDexLiquidityManager.sol";
import "./libs/Liquidity.sol";
import "hardhat/console.sol";


contract MDexV1PairNative is  HyperlaneConnectionClient, IMDexV1PairNative, INonfungibleNativeLiquidity {

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

    uint public constant MINIMUM_LIQUIDITY = 10**3;

    address public factory;
    address public remoteAddress;

    uint8 public constant FEE = 1;
    uint8 public constant PERCENT = 100;

    uint32 public LOCAL_DOMAIN;
    uint32 public REMOTE_DOMAIN;

    uint public reserve1;       
    uint public reserve2;  
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

    function _generateId(address _sender) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(_sender, positionCounter));
    }

    function addLiquidityCore(bytes32 id, uint amountIn1, uint amountIn2, address sender) external onlyFactory {

        if (pendingPosition[sender] == 0) {
            positionCounter++;
            positions[positionCounter] = LiquidityToken(id, 0, 0, amountIn1, amountIn2, sender);
            
            myPendingPositions.add(sender, positionCounter);
            pendingPosition[sender] = positionCounter;

        } else {

            // Adding to liquidity and removing from pending
            openPositionArray.push(pendingPosition[sender]);
            myOpenedPositions.add(sender, pendingPosition[sender]);
            myPendingPositions.remove(sender, pendingPosition[sender]);
            reserve1 += positions[pendingPosition[sender]].amountIn1;
            reserve2 += positions[pendingPosition[sender]].amountIn2;

            //pricing             
            kValue = (reserve1) * (reserve2);

            delete pendingPosition[sender];
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


    function removeLiquidityCore(uint amountIn, address from) external onlyFactory returns (uint amountOut) {


    }

    function swapCore(uint _amountIn, address _to) external onlyFactory returns (uint amountOut) {

        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings

        amountOut = getPrice(_amountIn); // get ouput
   
        if (_amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        console.log(reserve1, reserve2);

        payerInvestor(_amountIn);

        emit Swap(_to, _amountIn, amountOut);
    }

    function swapPay(uint _amountOut, address _to) external onlyFactory {
        console.log("addr", _to, _amountOut);
        (bool success, ) = payable(_to).call{value: _amountOut}("MDEX: SWAP_SUCCESSFUL");
        if (!success) revert("MDEX: SWAP_FAILED");
    }

    function payerInvestor(uint _amountIn) internal {

        uint fee = (_amountIn * FEE) / PERCENT; 

        for (uint i = 1; i <= openPositionArray.length;) {

            LiquidityToken storage position = positions[i];
            
            uint payOut = (PERCENT * position.amountIn1 * fee) / reserve1;

            position.availableFees += payOut;

            position.totalFees += payOut;

            unchecked {
                ++i;
            }
        }

    }

    receive() external payable {}

    fallback() external payable {}

}
