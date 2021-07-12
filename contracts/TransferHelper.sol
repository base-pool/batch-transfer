// SPDX-License-Identifier: MIT

pragma solidity >=0.6.12;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';
import 'hardhat/console.sol';

contract TransferHelper is Ownable {
    using SafeMath for uint256;

    address payable public receiver;
    uint256 public feePercent;

    event NewReceiver(address oldReceiver, address newReceiver);
    event NewFeePercent(uint256 oldFeePercent, uint256 newOldPercent);
    event TransferFrom(address token, address from, address to, uint256 amount, bool success);
    event BatchTransfer(address token, string symbol, uint256 decimals, address from, uint256 num, uint256 gasCost, uint256 gasFee);

    constructor(address payable _receiver, uint256 _feePercent) {
        require(_receiver != address(0), "illegal receiver");
        receiver = _receiver;
        emit NewReceiver(address(0), _receiver);
        feePercent = _feePercent;
        emit NewFeePercent(0, _feePercent);
    }

    function batchTransfer(address _token, address _from, address[] calldata _tos, uint256[] calldata _amounts, bool _ignoreError) external payable {
        require(_tos.length == _amounts.length, "illegal user num");
        uint gasPrice = tx.gasprice;
        uint gasBefore = gasleft();
        for(uint i = 0; i < _tos.length; i ++) {
            // bytes4(keccak256(bytes('transferFrom(address,address,uint256)')));
            (bool success, bytes memory data) = _token.call(abi.encodeWithSelector(0x23b872dd, _from, _tos[i], _amounts[i]));
            success = (success && (data.length == 0 || abi.decode(data, (bool))));
            emit TransferFrom(_token, _from, _tos[i], _amounts[i], success);
            if (!success) {
                if (_ignoreError) {
                    continue;
                } else {
                    require(false, "transfer failed");
                }
            }
        }
        uint gasAfter = gasleft();
        uint fee = gasBefore.sub(gasAfter).mul(gasPrice).mul(feePercent).div(1e18);
        require(msg.value >= fee, "airDrop fee not enough");
        if (msg.value.sub(fee) > 0) {
            receiver.transfer(msg.value.sub(fee));
        }
        emit BatchTransfer(_token, ERC20(_token).symbol(), ERC20(_token).decimals(), _from, _tos.length, gasBefore.sub(gasAfter).mul(gasPrice), fee);
    }

    function setReceiver(address payable _receiver) external onlyOwner {
        require(_receiver != address(0), "illegal receiver");
        emit NewReceiver(receiver, _receiver);
        receiver = _receiver;
    }

    function setFeePercent(uint256 _feePercent) external onlyOwner {
        emit NewFeePercent(feePercent, _feePercent);
        feePercent = _feePercent;
    }
}
