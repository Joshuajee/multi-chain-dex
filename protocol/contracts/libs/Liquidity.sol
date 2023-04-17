// SPDX-License-Identifier: MIT
pragma solidity  0.8.19;

import "../interfaces/IMDexLiquidityManager.sol";

library Liquidity  {
    // Iterable mapping from address to uint;
    struct Map {
        address[] keys;
        mapping(address => uint[]) values;
        mapping(address => uint) indexOf;
        mapping(address => bool) inserted;
    }

    function get(Map storage map, address key) internal view returns (uint[] memory) {
        return map.values[key];
    }

    // function getKeyAtIndex(Map storage map, uint index) internal view returns (address) {
    //     return map.keys[index];
    // }

    // function size(Map storage map) internal view returns (uint) {
    //     return map.keys.length;
    // }

    function add(Map storage map, address key, uint val) internal {
        if (map.inserted[key]) {
            map.values[key].push(val);
        } else {
            map.inserted[key] = true;
            map.values[key].push(val);
            map.indexOf[key] = map.keys.length;
            map.keys.push(key);
        }
    }

    function remove(Map storage map, address key, uint tokenId) internal {

        uint[] memory tokenIds = map.values[key];

        for (uint i = 0; i < tokenIds.length; i++) {

            if (tokenIds[i] == tokenId) {

                map.values[key][i] = tokenIds[tokenIds.length - 1];
                
                map.values[key].pop();
          
                break;
            }
        
        }

    }

    
}