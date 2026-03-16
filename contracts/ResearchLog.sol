// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract ResearchLog {

    struct Version {
        string ipfsHash;
        bytes32 fileHash;
        uint256 timestamp;
    }

    struct Research {
        uint256 id;
        address author;
        Version[] versions;
    }

    uint256 public researchCount;

    mapping(uint256 => Research) public researches;

    uint256[] public researchIds;

    event ResearchCreated(
        uint256 indexed researchId,
        address indexed author,
        bytes32 fileHash,
        uint256 timestamp
    );

    event VersionAdded(
        uint256 indexed researchId,
        bytes32 fileHash,
        uint256 timestamp
    );

    function createResearch(
        string memory _ipfsHash,
        bytes32 _fileHash
    ) public {

        researchCount++;

        Research storage r = researches[researchCount];

        r.id = researchCount;
        r.author = msg.sender;

        r.versions.push(
            Version({
                ipfsHash: _ipfsHash,
                fileHash: _fileHash,
                timestamp: block.timestamp
            })
        );

        researchIds.push(researchCount);

        emit ResearchCreated(
            researchCount,
            msg.sender,
            _fileHash,
            block.timestamp
        );
    }

    function addVersion(
        uint256 _researchId,
        string memory _ipfsHash,
        bytes32 _fileHash
    ) public {

        Research storage r = researches[_researchId];

        require(r.id != 0, "Research does not exist");

        require(msg.sender == r.author, "Only author can add versions");

        uint256 versionCount = r.versions.length;

        for (uint256 i = 0; i < versionCount; i++) {
            require(
                r.versions[i].fileHash != _fileHash,
                "Duplicate version"
            );
        }

        r.versions.push(
            Version({
                ipfsHash: _ipfsHash,
                fileHash: _fileHash,
                timestamp: block.timestamp
            })
        );

        emit VersionAdded(
            _researchId,
            _fileHash,
            block.timestamp
        );
    }

    function getVersion(
        uint256 _researchId,
        uint256 _versionIndex
    ) public view returns (
        string memory ipfsHash,
        bytes32 fileHash,
        uint256 timestamp
    ) {

        Research storage r = researches[_researchId];

        require(r.id != 0, "Research does not exist");

        Version storage v = r.versions[_versionIndex];

        return (
            v.ipfsHash,
            v.fileHash,
            v.timestamp
        );
    }

    function getVersionCount(
        uint256 _researchId
    ) public view returns (uint256) {

        Research storage r = researches[_researchId];

        require(r.id != 0, "Research does not exist");

        return r.versions.length;
    }

    function getResearchIds() public view returns (uint256[] memory) {
        return researchIds;
    }
}