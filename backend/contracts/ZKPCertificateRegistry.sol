// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZKPCertificateRegistry {
    struct ZKPCertificate {
        address student;
        string metadataURI;
        uint256 issuedAt;
    }

    mapping(uint256 => ZKPCertificate) public certificates;
    uint256 public nextId = 1;

    event ZKPCertificateCreated(uint256 indexed certId, address indexed student, string metadataURI, uint256 issuedAt);

    function createZKPCertificate(address student, string memory metadataURI) public returns (uint256) {
        certificates[nextId] = ZKPCertificate(student, metadataURI, block.timestamp);
        emit ZKPCertificateCreated(nextId, student, metadataURI, block.timestamp);
        nextId++;
        return nextId - 1;
    }

    function getCertificate(uint256 certId) public view returns (address, string memory, uint256) {
        ZKPCertificate memory cert = certificates[certId];
        return (cert.student, cert.metadataURI, cert.issuedAt);
    }
} 