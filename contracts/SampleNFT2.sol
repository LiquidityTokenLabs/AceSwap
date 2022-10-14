//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.16;
import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract SampleNFT2 is ERC721Enumerable, Ownable {
  using Counters for Counters.Counter;
  using Strings for uint256;

  string public baseURI;
  Counters.Counter private _tokenIdTracker;

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _initBaseURI
  ) ERC721(_name, _symbol) {
    setBaseURI(_initBaseURI);
  }

  function tokenURI(uint256 _tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(_exists(_tokenId), "nonexistent token");
    bytes memory json = abi.encodePacked(
      "{",
      '"name": "Astar Candy #',
      _tokenId.toString(),
      '",',
      '"description": "This NFT is a limited edition NFT issued through a collaboration between Astar Network, CryptoBar P2P and YomiSwap.",',
      '"image":',
      baseURI,
      "}"
    );
    bytes memory metadata = abi.encodePacked(
      "data:application/json;base64,",
      Base64.encode(bytes(json))
    );
    return string(metadata);
  }

  function batchMint(address to, uint256 num) public onlyOwner {
    for (uint256 i = 0; i < num; i++) {
      _tokenIdTracker.increment();
      uint256 tokenId = _tokenIdTracker.current();
      _mint(to, tokenId);
    }
  }

  function mint() public {
    _tokenIdTracker.increment();
    uint256 tokenId = _tokenIdTracker.current();
    _mint(msg.sender, tokenId);
  }

  function batchApprove(uint256[] calldata tokenIds, address to) public {
    for (uint256 i = 0; i < tokenIds.length; i++) {
      approve(to, tokenIds[i]);
    }
  }

  function getAllHeldIds(address user)
    external
    view
    returns (uint256[] memory)
  {
    uint256 numNFTs = balanceOf(user);
    uint256[] memory ids = new uint256[](numNFTs);
    for (uint256 i; i < numNFTs; i++) {
      ids[i] = tokenOfOwnerByIndex(user, i);
    }
    return ids;
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }
}
