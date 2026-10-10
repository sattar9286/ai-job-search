---
framework_version: 1.1.1
---

# Candidate Profile

<!-- SETUP: This file is populated by running /setup -->
<!-- After running /setup, all sections will be filled with your actual information -->

## Identity
- **Name:** Abdul Sattar
- **Location:** Karachi, Pakistan
- **Phone:** +92 302 264 5125
- **Email:** sattardariya@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/sattardariya
- **GitHub:** (not listed)
- **Status:** Employed (Embedded DevOps Engineer at Covolv.ai)
- **Constraints:** Based in Karachi; open to remote work with international teams (Europe, Middle East, Asia experience)

### Languages
<!-- Every language you can work in professionally, with your honest level. Used by the
Language Gate in 04-job-evaluation.md and by job-scraper/search-queries.md's query-language
generation. Omit any language you don't actually work in - an undeclared language is treated as
a hard no, not a gap to smooth over. -->

| Language | Level | Notes |
|----------|-------|-------|
| English | Native | Used across all professional work with US/EU/ME teams |

## Education

| Degree | Period | Institution | Key Topics |
|--------|--------|-------------|------------|
| BSc in Computer Science | 2013 - 2017 | DHA Suffa University, Karachi, Pakistan | Final Year Project: 3D Handheld Scanner using Leap Motion (C++, OpenCV, PCL, CMake) |

## Professional Experience

### Embedded DevOps Engineer - Covolv.ai (Jan 2025 - Present)
Pakistan
Sole embedded engineer and Yocto BSP architect for an autonomous driving platform, owning the full lifecycle from requirement gathering and system design through multi-layer build integration, CI/CD optimizations, and live hardware validation, while concurrently supervising one developer on pipeline automation and contributing to XOPS team process engineering.

- Architected a three-layer Yocto BSP stack entirely from scratch as the sole embedded engineer, taking full ownership from initial requirement gathering, dependency inventory, and system design through documentation, implementation, and ongoing maintenance, with no prior internal knowledge base to build on.
- Designed and built meta-debian, a custom Yocto meta-layer that sources, cross-compiles, and integrates the Ubuntu/Debian native packages the autonomous driving stack depends on into the Yocto build system, resolving RDEPENDS, DEPENDS, and native/target sysroot conflicts to make external APT-world packages first-class BitBake citizens.
- Developed meta-covolv, the organization's core extension layer, which inherits and extends upstream BitBake recipes from Poky, OpenEmbedded, and meta-ros using BBAPPEND and custom class inheritance, enabling Covolv-specific compiler flags, runtime configuration, and board-specific behavior to be layered on top of upstream recipes without forking, keeping future upstream syncs clean.
- Engineered meta-autonomous, the top-level application layer, that encapsulates the entire monolithic autonomous driving codebase as a single, self-contained BitBake recipe, resolving all intra-project dependency ordering so each sub-component can be independently fetched, patched, configured, compiled, and packaged by Yocto.
- Produced a formal system architecture document and living package inventory illustrating how all three meta-layers interconnect from base Poky through BSP to the application layer, along with multi-approach design documentation comparing recipe implementation strategies with trade-off analysis.
- Reduced CI build times by ~95% for the wider development team by diagnosing a 3-hour full-build bottleneck caused by monolithic compilation, decomposing the project into independently buildable units with clean dependency boundaries, and reducing per-module compile time to single-digit minutes.
- Eliminated redundant recompilation across CI pipelines by redesigning GitLab CI dependency graphs to implement precise change detection, ensuring only modules with genuine source or dependency changes are rebuilt.
- Automated dynamic compilation flag injection at build time by engineering a configuration resolver that interrogates the target hardware profile and environment state at each compile stage, supplying the correct compiler and linker flags on-the-fly.
- Supervised and technically mentored one junior pipeline engineer on GitLab CI YAML authoring, pipeline stage design, and Docker layer caching strategies.
- Contributed to the XOPS team as a process improvement engineer, grooming cross-functional teams on Scrum adoption and sprint ceremony practices while redesigning and validating JIRA project workflows and issue validation rules.
- Owned the complete hardware bring-up and validation loop: building Yocto images end-to-end, flashing target embedded boards, and running integration tests to verify boot and stack initialization on physical hardware.

**Technologies:** GitLab CI/CD, Docker, Yocto, BitBake, Poky, OpenEmbedded, CMake, Colcon, ROS, Python, Bash, C++, Jira, Confluence

### Principal Software Engineer - C++ (Payments & Transactions) - Avanza Solutions (May 2024 - Sept 2024)
Pakistan
- Built microservices-based transaction flows for SWIFT P2P payments, enabling secure, low-latency cross-border payment processing at scale.
- Developed high-availability gateway services to increase transactions per second (TPS) for concurrent financial workloads, improving system throughput under peak load.
- Supported government monetary certification for payment compliance, coordinating with regulatory bodies to meet national payment authority mandates.

**Technologies:** C++, ISO 8583, ISO 20022, Jenkins, REST API, SOAP, Message Queues

### Senior C++ Software Engineer - BMW Infotainment Systems - Critical Techworks (BMW Group) (Oct 2023 - Apr 2024)
Portugal
- Improved system reliability of BMW infotainment platform by designing and implementing recovery features for unexpected shutdown scenarios, reducing unplanned downtime.
- Integrated unit testing frameworks and automated build validation using Zuul CI, increasing test coverage and catching regressions earlier in the development pipeline.

**Technologies:** C++, Python, Yocto, Microservices, GTest, GMock, Zuul CI

### Senior C++ Software Engineer - Telecom Contact Centers - Afiniti (Nov 2020 - Sept 2023)
Pakistan
- Designed and delivered real-time telephony services over RTP and SIP for major US carriers including AT&T, Verizon, and Converge One, handling millions of concurrent call-routing decisions.
- Led migration of monolithic telecom systems to a microservices architecture using Docker, improving scalability, deployment independence, and fault isolation across production services.
- Reduced SonarQube-reported defect density significantly by refactoring legacy codebases with modern C++ idioms and implementing comprehensive unit test suites with GTest and GMock.

**Technologies:** C++, SIP, VoIP, RTP, ASAI Protocol, Docker, Microservices, CI/CD, SonarQube, GTest, GMock

### Software Engineer - Digital Banking Platforms - Avanza Solutions (Jun 2018 - Nov 2020)
Pakistan
- Built core digital banking services integrating ISO 8583 message processing with REST and SOAP APIs to connect banking channels, switch networks, and payment processors.
- Enhanced ATM transaction solutions for Diebold, NCR, and Wincor hardware using NDC protocol, improving transaction reliability and reducing terminal downtime for multiple bank clients.
- Delivered EMV certification and national switch integration mandates for multiple banks, ensuring full compliance with card scheme and central bank requirements.

**Technologies:** C++, SOAP, REST, ISO 8583, NDC Protocol, EMV, PCI DSS

## Independent Projects
<!-- Projects outside of employment: freelance, open source, personal -->
- **[PROJECT_NAME]**: [DESCRIPTION]

## Technical Skills

### Programming & Scripting
- **C++** (expert): STL, multithreading, modern C++ idioms
- **C** (proficient): embedded systems
- **Python** (proficient): automation, scripting, backend services
- **Bash** (proficient): CI/CD scripting, build automation

### Embedded & Build Systems
- Yocto Project, BitBake, Poky, OpenEmbedded, BSP Layer Design, Cross-Compilation, Embedded Linux, ROS, CMake, Colcon

### DevOps & CI/CD
- GitLab CI/CD, Jenkins, Zuul CI, Docker, Git, Bitbucket, SonarQube, GTest, GMock, Pipeline Optimization

### Payment Systems
- ISO 8583, ISO 20022, EMV, PCI DSS, PADSS, mPOS, QR Payments, VISA/MasterCard, SWIFT, NDC Protocol, Financial Middleware, Payment Gateways

### Architectures & Integration
- Microservices, Design Patterns, High Availability Systems, SOAP, REST, SIP, RTP, ASAI, TCP/IP, IPC, TDD, EDD

### Cloud & Process
- AWS, Agile, Scrum, Kanban, Jira, Confluence, Slack, Remote Teamwork, PlantUML

## Certifications
- **Solid Principles (2023) for Software Design & Architecture**
- **Test-Driven Development in C++**
- **Advanced Design Patterns: Design Principles**
- **MERN Essential Training**

## Publications
- (None)

## Awards
- NGIRI-funded Final Year Project by National ICT R&D Fund

## References
- Available upon request.
