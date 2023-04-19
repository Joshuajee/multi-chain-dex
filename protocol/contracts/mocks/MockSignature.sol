// SPDX-License-Identifier: MIT
pragma solidity  ^0.8.0;


contract MockSignature {


    function encodeCreatePairReceiver(uint32 domain, uint256 kValue, address caller) external pure returns (bytes memory) {
        return abi.encodeWithSignature("createPairReceiver(uint32,uint256,address)", domain, kValue, caller);
    }

    function encodeAddLiquidity(uint256 _amountIn, address _sender) external pure returns (bytes memory) {
        uint256 position = 0;
        return abi.encodeWithSignature("addLiquidityReceiver(bytes32,uint256,address)", keccak256(abi.encodePacked(_sender, position)), _amountIn, _sender);
    }

    function encodeSwap(uint _amountIn, address _sender) external pure returns (bytes memory) {
        return abi.encodeWithSignature("swapReceiver(uint,address)", _amountIn, _sender);
    }

    function bytes32ToAddress(bytes32 _buf) external pure returns (address) {
        return address(uint160(uint256(_buf)));
    }
  
    function addressToBytes32(address _addr) external pure returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }


}


