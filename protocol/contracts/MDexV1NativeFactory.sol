// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import "@hyperlane-xyz/core/contracts/HyperlaneConnectionClient.sol";
import "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import './interfaces/IMDexV1PairNative.sol';
import './interfaces/IMDexV1CloneFactory.sol';
import './interfaces/IMDexV1NativeFactory.sol';
import './MDexV1PairNative.sol';
import 'hardhat/console.sol';


contract MDexV1NativeFactory is HyperlaneConnectionClient, IMDexV1NativeFactory {

    //Events
    event PairCreated(uint32 indexed remoteDomain, address indexed remoteAddress, address indexed pair, uint pairCount);

    //Liberies
    using TypeCasts for bytes32;
    using TypeCasts for address;

    address public clonefactory;

    uint32 public LOCAL_DOMAIN;

    uint public constant MINIMUM_LIQUIDITY = 10**3;

    mapping(uint => mapping(uint => address)) public getPair;
    address[] public allPairs;

    // Personal Positions
    mapping(address => Position[]) public userOpenPositions;
    mapping(address => Position[]) public userPendingPositions;
    //mapping(address => Position[]) public userClosedPositions;



    //Modifiers
     modifier isPaymentValid(uint _gasAmount, uint _amountIn1, uint _amount2, uint32 _remoteDomain) {
        {    
            uint quote = quoteGasPayment(_remoteDomain, _gasAmount);
            if (_amountIn1 + quote > msg.value) revert("MDEX: INSUFFIENT GAS");
        }
        _;
    }

    modifier isPayingEnoughGas(uint _gasAmount, uint _amountIn1, uint32 _remoteDomain) {
        {    
            uint quote = quoteGasPayment(_remoteDomain, _gasAmount);
            if (_amountIn1 + quote > msg.value) revert("MDEX: INSUFFIENT GAS");
        }
        _;
    }

    modifier isAboveMinAmount(uint _amountIn1, uint _amountIn2) {
        {
            if (_amountIn1 < MINIMUM_LIQUIDITY && _amountIn2 < MINIMUM_LIQUIDITY) revert("MDEX: LIQUIDITY TOO SMALL");
        }
        _;
    }

    constructor(uint32 _domain, address _cloneFactory) {
        LOCAL_DOMAIN = _domain;
        clonefactory = _cloneFactory;
    }

    function initialize(address _mailbox, address _interchainGasPaymaster) external initializer() {
        __HyperlaneConnectionClient_initialize(
            _mailbox, 
            _interchainGasPaymaster
        );
    }

    function _getGas(uint _amountIn1) internal view returns(uint) {
        return msg.value - _amountIn1;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function addPosition(uint32 _remoteDomain, uint _positionId, address _sender, address _remoteAddress, address _pair) internal {
        bool found = false;
        uint length = userPendingPositions[_sender].length;
        for (uint i = 0; i < length; ) {
            if (userPendingPositions[_sender][i].positionId == _positionId) {
                userOpenPositions[_sender].push(Position(_remoteDomain, _positionId, _remoteAddress, _pair));
                found = true;
                //remove from pending list
                userPendingPositions[_sender][i] = userOpenPositions[_sender][length - 1];
                userPendingPositions[_sender].pop(); 
                break;
            }
            unchecked {
                ++i;
            }
        }
        if (!found) userPendingPositions[_sender].push(Position(_remoteDomain, _positionId, _remoteAddress, _pair));
    }


    // function removePosition(uint32 _remoteDomain, uint _positionId, address _owner, Position [] storage _positions) internal {

    //     uint length = _positions.length;

    //     for (uint i = 0; i < length; ) {

    //         if (_positions[i].positionId == _positionId && _remoteDomain == _positions[i].remoteDomain) {
    //             userClosedPositions[_owner].push(_positions[i]);
    //             _positions[i] = _positions[length - 1];
    //             _positions.pop();
    //             break;
    //         }

    //         unchecked {
    //             ++i;
    //         }

    //     }

    // }

    function contractFactory (uint32 _remoteDomain, address _remoteAddress) internal returns (address pair) {
        
        pair = IMDexV1CloneFactory(clonefactory).nativeCloneFactory(LOCAL_DOMAIN, _remoteDomain, _remoteAddress);

        IMDexV1PairNative(pair).initialize(
            address(mailbox), 
            address(interchainGasPaymaster)
        ); 

        getPair[LOCAL_DOMAIN][ _remoteDomain] = pair;
        getPair[ _remoteDomain][LOCAL_DOMAIN] = pair; 
        allPairs.push(pair);

    }

    function getUserOpenPositions(address _owner) external view returns (LiquidityToken[] memory) {
        
        uint length = userOpenPositions[_owner].length;

        LiquidityToken[] memory liquidityToken = new LiquidityToken[](length);
    
        for (uint i = 0; i < length; ) {

            uint position = userOpenPositions[_owner][i].positionId;
            address pair = userOpenPositions[_owner][i].pair;

            liquidityToken[i] = IMDexV1PairNative(pair).getPosition(position);

            unchecked {
                ++i;
            }

        }

        return liquidityToken;

    }

    function getUserPendingPositions(address _owner) external view returns (LiquidityToken[] memory) {
        
        uint length = userPendingPositions[_owner].length;

        LiquidityToken[] memory liquidityToken = new LiquidityToken[](length);
    
        for (uint i = 0; i < length; ) {

            uint position = userPendingPositions[_owner][i].positionId;
            address pair = userPendingPositions[_owner][i].pair;

            liquidityToken[i] = IMDexV1PairNative(pair).getPosition(position);

            unchecked {
                ++i;
            }

        }

        return liquidityToken;
    }


    // function getUserClosedPositions(address _owner) external view returns (LiquidityToken[] memory) {

    //     uint length = userClosedPositions[_owner].length;

    //     LiquidityToken[] memory liquidityToken = new LiquidityToken[](length);
    
    //     for (uint i = 0; i < length; ) {

    //         uint position = userClosedPositions[_owner][i].positionId;
    //         address pair = userClosedPositions[_owner][i].pair;

    //         liquidityToken[i] = IMDexV1PairNative(pair).getPosition(position);

    //         unchecked {
    //             ++i;
    //         }

    //     }

    //     return liquidityToken;
    // }

    function createPair(
        uint32 _remoteDomain, 
        uint _amountIn1, 
        uint _amountIn2, 
        uint _gasAmount, 
        address _remoteAddress) external payable 
            isPayingEnoughGas(_gasAmount, _amountIn1, _remoteDomain) 
            //isPaymentValid(_gasAmount, _amountIn1, _amountIn2, _remoteDomain) 
            {

        {
            if (LOCAL_DOMAIN == _remoteDomain) revert('MDEX: IDENTICAL_CHAIN');

            (uint32 chainA, uint32 chainB) = LOCAL_DOMAIN <  _remoteDomain ? (LOCAL_DOMAIN,  _remoteDomain) : ( _remoteDomain, LOCAL_DOMAIN);

            if (getPair[chainA][chainB] != address(0)) revert('MDEX: ALREADY EXISTS');

        }

        {
            address pair = contractFactory(_remoteDomain, _remoteAddress);

            bytes32 _id = IMDexV1PairNative(pair).generateId(msg.sender);

            bytes32 messageId = IMailbox(mailbox).dispatch(
                _remoteDomain,
                _remoteAddress.addressToBytes32(),
                abi.encodeWithSignature("createPairReceiver(uint32,uint256,uint256,address,address)", LOCAL_DOMAIN, _amountIn1, _amountIn2, msg.sender, address(this))
            );
 
            (bool success, ) = payable(pair).call{ value: _amountIn1}("");

            if (!success) revert("MDEX: Transaction Failed");

            uint position = IMDexV1PairNative(pair).addLiquidityCore(_id, _amountIn1, _amountIn2, msg.sender, true);
            
            payForGas(messageId, _remoteDomain, _gasAmount,  msg.value - _amountIn1);
            
            addPosition(_remoteDomain, position,  msg.sender,_remoteAddress, pair);

            emit PairCreated(_remoteDomain, _remoteAddress, pair, allPairs.length);

        }
    
    }


    function addLiquidity(uint32 _remoteDomain, uint _amountIn1, uint _amountIn2, uint _gasAmount, address _remoteAddress) external payable {

        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];

        bytes32 _id = IMDexV1PairNative(pair).generateId(msg.sender);

        bytes32 messageId = mailbox.dispatch(
            _remoteDomain,
            _remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("addLiquidityReceiver(bytes32,uint32,uint256,uint256,address,address)", _id, LOCAL_DOMAIN, _amountIn1, _amountIn2, msg.sender, address(this))
        );
        
        {
            (bool success, ) = payable(pair).call{ value: _amountIn1}("");

            if (!success) revert("MDEX: Transaction Failed");
        }

        payForGas(messageId, _remoteDomain, _gasAmount, _getGas(_amountIn1));

        uint position = IMDexV1PairNative(pair).addLiquidityCore(_id, _amountIn1, _amountIn2, msg.sender, true);   
    
        addPosition(_remoteDomain, position, msg.sender, _remoteAddress, pair);
    }

    function removeLiquidity(uint32 _remoteDomain, uint _position, uint _gasAmount, address _remoteAddress) external payable {

        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];

        //removePosition(_remoteDomain, _position, msg.sender, userOpenPositions[msg.sender]);

        bytes32 _id = IMDexV1PairNative(pair).removeLiquidityCore(_position, msg.sender);

        bytes32 messageId = mailbox.dispatch(
            _remoteDomain,
            _remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("removeLiquidityReceiver(bytes32,uint32,address,address)", _id, LOCAL_DOMAIN, msg.sender, address(this))
        );

        payForGas(messageId, _remoteDomain, _gasAmount, msg.value);

    }

    function swap(uint32 _remoteDomain, uint _amountIn, uint _gasAmount, address _to, address _remoteAddress) external payable {

        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];

        uint amountOut = IMDexV1PairNative(pair).swapCore(_amountIn, _to);

        bytes32 messageId = mailbox.dispatch(
            _remoteDomain,
            _remoteAddress.addressToBytes32(),
            abi.encodeWithSignature("swapReceiver(uint32,uint256,uint256,address,address)", LOCAL_DOMAIN, _amountIn, amountOut, _to, address(this))
        );

        {
            (bool success, ) = payable(pair).call{ value: _amountIn}("");

            if (!success) revert("MDEX: Transaction Failed");
        }

        payForGas(messageId, _remoteDomain, _gasAmount, _getGas(_amountIn));

    }


    // =========== Receivers =============

    function createPairReceiver(uint32 _remoteDomain,  uint256 _amountIn1, uint256 _amountIn2,  address _owner, address _remoteAddress) external onlyMailbox returns (address pair) {
        pair = contractFactory(_remoteDomain,  _remoteAddress);
        
        bytes32 _id = IMDexV1PairNative(pair).generateId(_owner);

        uint position = IMDexV1PairNative(pair).addLiquidityCore(_id, _amountIn2, _amountIn1, _owner, false); 
        
        addPosition(_remoteDomain, position, _owner, _remoteAddress, pair); 

        emit PairCreated(_remoteDomain, _remoteAddress, pair, allPairs.length);
    }

    function addLiquidityReceiver(bytes32 _id, uint32 _remoteDomain, uint256 _amountIn1, uint256 _amountIn2, address _sender, address _remoteAddress) external onlyMailbox {
        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];
        
        uint position = IMDexV1PairNative(pair).addLiquidityCore(_id, _amountIn2, _amountIn1, _sender, false);   

        addPosition(_remoteDomain, position, _sender, _remoteAddress, pair); 
    }

    // function removeLiquidityReceiver(bytes32 _id, uint32 _remoteDomain, address _owner, address _remoteAddress) external onlyMailbox {

    //     address pair = getPair[LOCAL_DOMAIN][_remoteDomain];

    //     //uint positionIndex = 0;

    //     Position[] storage myPositions = userOpenPositions[_owner];

    //     for (uint i = 0; i < myPositions.length;) {

    //         if(myPositions[i].remoteDomain == _remoteDomain) {

    //             LiquidityToken memory position = IMDexV1PairNative(pair).getPosition(myPositions[i].positionId);

    //             if (position.id == _id) {

    //                 //removePosition(_remoteDomain, myPositions[i].positionId, _owner, myPositions);

    //                 IMDexV1PairNative(pair).removeLiquidityCore(myPositions[i].positionId, _owner);

    //                 break;
    //             }

    //         }

    //         unchecked {
    //             ++i;
    //         }

    //     }

    // }

    function swapReceiver(uint32 _remoteDomain, uint256 _amountIn, uint256 _amountOut, address _to, address _remoteAddress) external onlyMailbox  {
        address pair = getPair[LOCAL_DOMAIN][_remoteDomain];
        IMDexV1PairNative(pair).swapPay(_amountIn, _amountOut, _to);
        console.log(_remoteAddress);
    }

    // gas payment
    function payForGas(bytes32 _messageId, uint32 _remoteDomain, uint256 _gasAmount, uint _gas) public payable {
        
        IInterchainGasPaymaster(interchainGasPaymaster).payForGas{ value: _gas }(
            _messageId, // The ID of the message that was just dispatched
            _remoteDomain, // The remote domain of the message
            _gasAmount, // 50k gas to use in the recipient's handle function
            msg.sender // refunds go to msg.sender, who paid the msg.value
        );

    }

    // get gas info
    function quoteGasPayment(uint32 _remoteDomain, uint256 _gasAmount) public view returns (uint256) {
        return IInterchainGasPaymaster(interchainGasPaymaster).quoteGasPayment(_remoteDomain, _gasAmount);
    }

    // hyperlane message handler
    function handle(uint32 _origin, bytes32 _sender, bytes calldata _body) external onlyMailbox  {        
        address sender = _sender.bytes32ToAddress();
        (bool success,) = address(this).delegatecall(_body);
        if (!success) revert("MDEX: Transaction Failed");
        emit ReceivedMessage(_origin, sender, _body);
    }

}
