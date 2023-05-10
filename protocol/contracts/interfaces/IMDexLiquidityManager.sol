// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface INonfungibleNativeLiquidity {

    struct LiquidityToken {
        bytes32 id;
        uint availableFees;
        uint totalFees;
        uint amountIn1;
        uint amountIn2;
        bool paid;
        address owner;
        uint tokenId;
    }

  
}