// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable {
    /**
     * @dev _baseTokenURI是用来计算{tokenURI}的。如果设置了，每个token的结果URI将是`baseURI`和`tokenId`的连接。
     * 所以如果baseURI是`https://example.com/api/token/`，tokenId是`1`，那么该token的tokenURI将是`https://example.com/api/token/1`。
     */
    string _baseTokenURI;

    // _price 代表着一个Crypto Dev NFT的价格
    uint256 public _price = 0.01 ether;

    // _paused 用来在紧急情况下暂停合约
    bool public _paused;

    // max number of CryptoDevs
    uint256 public maxTokenIds = 20;

    // tokenIds代表着已经被创建的Crypto Devs的数量
    uint256 public tokenIds;

    // Whitelist合约实例
    IWhitelist whitelist;

    // 用来记录预售是否开始
    bool public presaleStarted;

    // 用来记录预售结束的时间戳
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused() {
        require(!_paused, "Contract currently paused");
        _;
    }

    /**
     * @dev ERC721构造函数接收一个`name`和一个`symbol`作为token集合的名称和符号。
     * 在我们的例子中，name是`Crypto Devs`，symbol是`CD`。
     * Crypto Devs的构造函数接收一个baseURI作为集合的_baseTokenURI。
     * 它还初始化了一个whitelist接口的实例。
     */
    constructor(
        string memory baseURI,
        address whitelistContract
    ) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    /**
     * @dev 为白名单列表中的地址开启预售
     */
    function startPresale() public onlyOwner {
        presaleStarted = true;
        // 设置预售结束时间为当前时间戳 + 5分钟
        // Solidity有很酷的语法来表示时间戳（秒，分钟，小时，天，年）
        presaleEnded = block.timestamp + 5 minutes;
    }

    /**
     * @dev presaleMint允许用户在预售期间每次交易生成一个NFT。
     */
    function presaleMint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp < presaleEnded,
            "Presale is not running"
        );
        require(
            whitelist.whitelistedAddresses(msg.sender),
            "You are not whitelisted"
        );
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        // _safeMint是一个更安全的版本，它确保如果被创建的地址是一个合约，那么它知道如何处理ERC721 token。
        // 如果被创建的地址不是一个合约，它的工作方式与_mint相同。
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev mint函数允许用户在预售结束后每次交易生成一个NFT。
     */
    function mint() public payable onlyWhenNotPaused {
        require(
            presaleStarted && block.timestamp >= presaleEnded,
            "Presale has not ended yet"
        );
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");
        tokenIds += 1;
        _safeMint(msg.sender, tokenIds);
    }

    /**
     * @dev _baseURI覆盖了Openzeppelin的ERC721实现，该实现默认情况下返回baseURI的空字符串
     * @return the baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev setPaused函数用来暂停或者取消暂停合约
     */
    function setPaused(bool val) public onlyOwner {
        _paused = val;
    }

    /**
     * @dev withdraw函数用来从合约中提取以太币
     */
    function withdraw() public onlyOwner {
        address _owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}
}
