// SPDX-License-Identifier: MIT OR Apache-2.0
pragma solidity ^0.8.0;

interface IInterchainGasPaymaster {

    event GasPayment(
        bytes32 indexed messageId,
        uint256 gasAmount,
        uint256 payment
    );

    function payForGas(
        bytes32 _messageId,
        uint32 _destinationDomain,
        uint256 _gasAmount,
        address _refundAddress
    ) external payable;

    function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount)
        external
        view
        returns (uint256);
}

contract MockInterchainGasPaymaster is IInterchainGasPaymaster {

    mapping(uint32 => uint) public gasPrices;

    function payForGas(
        bytes32 _messageId,
        uint32 _destinationDomain,
        uint256 _gasAmount,
        address _refundAddress
    ) external payable override {
        uint256 _requiredPayment = quoteGasPayment(
            _destinationDomain,
            _gasAmount
        );
        require(
            msg.value >= _requiredPayment,
            "insufficient interchain gas payment"
        );
        uint256 _overpayment = msg.value - _requiredPayment;
        if (_overpayment > 0) {
            (bool _success, ) = _refundAddress.call{value: _overpayment}("");
            require(_success, "Interchain gas payment refund failed");
        }

        emit GasPayment(_messageId, _gasAmount, _requiredPayment);

    }

    function quoteGasPayment(uint32 _destinationDomain, uint256 _gasAmount)
        public
        view
        virtual
        override
        returns (uint256)
    {
        uint256 _destinationGasCost = _gasAmount * getExchangeRateAndGasPrice(_destinationDomain);

        return (_destinationGasCost ) / 333;
    }

    function getExchangeRateAndGasPrice(uint32 _destinationDomain) public view returns (uint) {
        return gasPrices[_destinationDomain];
    }


    function setExchangeRate(uint32 _remoteDomain, uint _gasPrice) public {
        gasPrices[_remoteDomain] = _gasPrice;
    }

}