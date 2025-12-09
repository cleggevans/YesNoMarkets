// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IYesNoMarket
 * @dev Interface for YesNoMarket contract
 */
interface IYesNoMarket {
    enum MarketState {
        Open,
        Resolved,
        Cancelled
    }

    struct Market {
        address creator;
        string question;
        uint256 endTime;
        MarketState state;
        uint256 totalYesShares;
        uint256 totalNoShares;
        uint256 yesPrice;
        uint256 noPrice;
        bool outcome;
        uint256 totalLiquidity;
        uint256 creatorFee;
    }

    struct UserShares {
        uint256 yesShares;
        uint256 noShares;
    }

    function createMarket(
        string memory _question,
        uint256 _endTime,
        uint256 _initialLiquidity,
        uint256 _creatorFee
    ) external payable returns (uint256);

    function buyShares(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) external payable;

    function sellShares(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) external;

    function resolveMarket(uint256 _marketId, bool _outcome) external;

    function claimWinnings(uint256 _marketId) external;

    function getMarket(uint256 _marketId) external view returns (Market memory);

    function getUserShares(uint256 _marketId, address _user) external view returns (UserShares memory);

    function calculateCost(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) external view returns (uint256);

    function calculatePayout(
        uint256 _marketId,
        bool _side,
        uint256 _shares
    ) external view returns (uint256);
}

