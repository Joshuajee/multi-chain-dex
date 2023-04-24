// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;


import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexV1PairNative.sol';
import "./interfaces/IMDexLiquidityManager.sol";
import "./libs/Liquidity.sol";


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

    function swapCore(uint amountIn, address to) external onlyFactory returns (uint amountOut) {

        (uint _reserve1, uint _reserve2,) = getReserves(); // gas savings

        amountOut = kValue / amountIn; // get ouput
   
        if (amountIn > _reserve1 && amountOut > _reserve2) revert('MDEX: INSUFFICIENT_LIQUIDITY');

        emit Swap(to, amountIn, amountOut);
    }


    function addLiquidityReceiver(bytes32 _id, uint256 _amountIn, uint256 _amountIn2, address _sender, address _remoteAddress) external onlyFactory {
        if (remoteAddress == address(0)) remoteAddress = _remoteAddress;
        //addLiquidityCore(_id, _amountIn2, _amountIn, _sender);    
    }

    function swapReceiver(uint256 _amountIn, address  _to) external onlyMailbox  {

        uint amountOut = getPrice(_amountIn);

        (bool success, ) = payable(_to).call{value: amountOut}("MDEX: SWAP_SUCCESSFUL");

        if (!success) revert("MDEX: SWAP_FAILED");

    }

    function addLiquidity(uint _amountIn, uint _amountIn2, uint _gasAmount, address _sender) external payable lock {

        if (remoteAddress == address(0)) revert('MDEX: REMOTE ADDRESS NOT SET YET');
        bytes32 messageId = mailbox.dispatch(
            REMOTE_DOMAIN,
            remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("addLiquidityReceiver(bytes32,uint256,uint256,address,address)", _generateId(_sender), _amountIn, _amountIn2, _sender, address(this))
        );

        payForGas(messageId, REMOTE_DOMAIN, _gasAmount, _getGas(_amountIn), _sender);

        //addLiquidityCore(_generateId(_sender), _amountIn, _amountIn2, _sender);    

    }

    function removeLiquidity(uint amountIn, address from) external lock  {


    }

    function swap(uint _amountIn, uint _gasAmount, address _to) external payable lock {

        bytes32 messageId = mailbox.dispatch(
            REMOTE_DOMAIN,
            remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("swapReceiver(uint256,address)", _amountIn, _to)
        );

        payForGas(messageId, REMOTE_DOMAIN, _gasAmount, _getGas(_amountIn), msg.sender);

        //swapCore(_amountIn, _to);

        payerInvestor(_amountIn);

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

    // gas payment
    function payForGas(
        bytes32 _messageId, 
        uint32 _destinationDomain, 
        uint256 _gasAmount,
        uint256 _value,
        address _refundAddress
        ) internal {
        
        IInterchainGasPaymaster(interchainGasPaymaster).payForGas{ value: _value }(
            _messageId, // The ID of the message that was just dispatched
            _destinationDomain, // The destination domain of the message
            _gasAmount, // 50k gas to use in the recipient's handle function
            _refundAddress // refunds go to msg.sender, who paid the msg.value
        );
    }

    // get gas info
    function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount) external view returns (uint256) {
        return IInterchainGasPaymaster(interchainGasPaymaster).quoteGasPayment(_destinationDomain, _gasAmount);
    }

    // hyperlane message handler
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external onlyMailbox lock {
        
        address sender = _sender.bytes32ToAddress();

        (bool success, ) = address(this).delegatecall(_body);

        if (!success) revert("MDEX: Transaction Failed");

        emit ReceivedMessage(_origin, sender, _body);

    }

    receive() external payable {}

    fallback() external payable {}

}
