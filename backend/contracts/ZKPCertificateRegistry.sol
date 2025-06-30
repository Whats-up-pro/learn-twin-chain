// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ZKPCertificateRegistry {
    struct ZKPCertificate {
        address student;
        string metadataURI;
        uint256 issuedAt;
        string certificateType;
    }

    mapping(uint256 => ZKPCertificate) public certificates;
    mapping(address => uint256[]) public studentCertificates;
    uint256 public nextId = 1;

    event ZKPCertificateCreated(
        uint256 indexed certId, 
        address indexed student, 
        string metadataURI, 
        uint256 issuedAt,
        string certificateType
    );

    function createZKPCertificate(
        address student, 
        string memory metadataURI,
        string memory certificateType
    ) public returns (uint256) {
        require(student != address(0), "Invalid student address");
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        certificates[nextId] = ZKPCertificate(
            student, 
            metadataURI, 
            block.timestamp,
            certificateType
        );
        
        studentCertificates[student].push(nextId);
        
        emit ZKPCertificateCreated(
            nextId, 
            student, 
            metadataURI, 
            block.timestamp,
            certificateType
        );
        
        return nextId++;
    }

    function getCertificate(uint256 certId) public view returns (
        address student,
        string memory metadataURI,
        uint256 issuedAt,
        string memory certificateType
    ) {
        ZKPCertificate memory cert = certificates[certId];
        require(cert.student != address(0), "Certificate does not exist");
        
        return (cert.student, cert.metadataURI, cert.issuedAt, cert.certificateType);
    }

    function getStudentCertificates(address student) public view returns (uint256[] memory) {
        return studentCertificates[student];
    }

    function getCertificateCount() public view returns (uint256) {
        return nextId - 1;
    }
} 