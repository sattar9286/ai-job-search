---
framework_version: 1.1.1
---

# Candidate Profile

## Identity
- **Name:** Abdul Sattar
- **Location:** Karachi, Pakistan
- **Phone:** +92 302 264 5125
- **Email:** sattardariya@gmail.com
- **LinkedIn:** https://linkedin.com/in/sattardariya
- **GitHub:** https://github.com/sattar9286
- **Status:** Employed — Embedded DevOps Engineer at Covolv.ai (Jan 2025 – present)
- **Constraints:** No commute constraint recorded. Actively seeking relocation abroad and fully remote work; open to visa-sponsored on-site roles internationally.

### Languages
<!-- Every language you can work in professionally, with your honest level. Used by the
Language Gate in 04-job-evaluation.md and by job-scraper/search-queries.md's query-language
generation. Omit any language you don't actually work in - an undeclared language is treated as
a hard no, not a gap to smooth over. -->

| Language | Level | Notes |
|----------|-------|-------|
| English | Fluent | **Primary working language.** Used across BMW Group (Porto) and US-carrier telecom engagements |
| Urdu | Native / Bilingual | |

<!-- German (Elementary, per LinkedIn) is deliberately NOT declared: at that level it would not
clear a German-language job condition anyway, and declaring it would invite false positives.
Consequence: postings requiring German as a job condition FAIL the Language Gate. -->

<!-- RESOLVED (setup, 2026-08-29): the LinkedIn export self-rates English as "Professional
Working". "Fluent" is the resolved value and the one the Language Gate uses, corroborated by the
Critical Techworks (Porto) engagement and the AT&T / Verizon / Converge One work. Do not re-raise
this as a cross-reference conflict on future /setup runs. -->

## Education

| Degree | Period | Institution | Key Topics |
|--------|--------|-------------|------------|
| BSc in Computer Science | 2013 – 2017 | DHA Suffa University, Karachi, Pakistan | Final Year Project: 3D Handheld Scanner using Leap Motion (C++, OpenCV, PCL, CMake) |
| High School, Pre-Engineering | 2008 – 2010 | Bahria College Karachi, Pakistan | |

## Professional Experience

<!-- RESOLVED (setup, 2026-08-29): the LinkedIn export lists a further role, "CodeX - Python Team
Lead" (Apr 2022 - Mar 2024, BRYTCASH and FROME projects), which overlaps Afiniti and Critical
Techworks. Abdul has decided it stays OFF the profile and out of CVs and cover letters. Do not
re-raise it as a cross-reference conflict on future /setup runs and do not add it back.

Two early roles in the export are likewise deliberately omitted: Wemsol Pvt Ltd (KEENU),
Software Engineer, Apr-Dec 2017, and Haball Pvt Ltd, Junior Software Engineer, Jan-May 2018.

Afiniti is deliberately recorded as ONE collapsed senior entry (Nov 2020 - Sept 2023); the export
splits it into C++ Software Engineer then Sr. Software Engineer. Critical Techworks is recorded
as "Senior C++ Software Engineer"; the export says "C++ Developer". Both are resolved - keep as
written. -->

### Embedded DevOps Engineer - Covolv.ai (Jan 2025 - Present)
Pakistan

<!-- RESOLVED (setup, 2026-08-29): "Covolv.ai" is the actual company name and is safe to use in
CVs and cover letters. The LinkedIn export lists this employer as "Stealth AI Startup"; that is a
LinkedIn-side label only, not a confidentiality constraint. Do not re-raise this as a
cross-reference conflict on future /setup runs, and do not substitute the LinkedIn wording. -->


Sole embedded engineer and Yocto BSP architect for an autonomous driving platform, owning the full lifecycle from requirement gathering and system design through multi-layer build integration, CI/CD optimisation, and live hardware validation — while concurrently supervising one developer on pipeline automation and contributing to XOPS team process engineering.

**Scope note (per Abdul):** there is no rigid role definition here; the remit has evolved. The sequence was (1) CI pipelines for a microservices architecture, (2) cross-compilation within embedded Yocto, (3) introducing Scrum and sprint practices to the organisation, and (4) currently leading Yocto, Jira, CI, and automation. "Embedded DevOps Engineer" is the fair title for the whole of it. When tailoring, pick the phase that matches the posting rather than presenting all four as simultaneous.

- Architected a three-layer Yocto BSP stack entirely from scratch as the sole embedded engineer — taking full ownership from initial requirement gathering, dependency inventory, and system design through documentation, implementation, and ongoing maintenance, with no prior internal knowledge base to build on.
- Designed and built **meta-debian**, a custom Yocto meta-layer that sources, cross-compiles, and integrates the Ubuntu/Debian native packages the autonomous driving stack depends on into the Yocto build system — resolving RDEPENDS, DEPENDS, and native/target sysroot conflicts to make external APT-world packages first-class BitBake citizens.
- Developed **meta-covolv**, the core organisational extension layer, which inherits and extends upstream BitBake recipes from Poky, OpenEmbedded, and meta-ros using BBAPPEND and custom class inheritance — enabling Covolv-specific compiler flags, runtime configuration, and board-specific behaviour to be layered on top of upstream recipes without forking, keeping future upstream syncs clean.
- Engineered **meta-autonomous**, the top-level application layer, encapsulating the entire monolithic autonomous driving codebase as a single self-contained BitBake recipe — resolving all intra-project dependency ordering so each sub-component can be independently fetched, patched, configured, compiled, and packaged by Yocto.
- Produced a formal system architecture document and living package inventory illustrating how all three meta-layers interconnect from base Poky through BSP to the application layer, plus multi-approach design documentation comparing recipe implementation strategies with trade-off analysis.
- Reduced CI build times by ~95% for the wider development team by diagnosing a 3-hour full-build bottleneck caused by monolithic compilation, decomposing the project into independently buildable units with clean dependency boundaries, and reducing per-module compile time to single-digit minutes.
- Eliminated redundant recompilation across CI pipelines by redesigning GitLab CI dependency graphs to implement precise change detection, ensuring only modules with genuine source or dependency changes are rebuilt.
- Automated dynamic compilation flag injection at build time by engineering a configuration resolver that interrogates the target hardware profile and environment state at each compile stage, supplying the correct compiler and linker flags on-the-fly — eliminating brittle hardcoded flag management across board targets.
- Supervised and technically mentored one junior pipeline engineer on GitLab CI YAML authoring, pipeline stage design, and Docker layer caching strategies.
- Contributed to the XOPS team as a process improvement engineer — grooming cross-functional teams on Scrum adoption and sprint ceremony practices while redesigning and validating JIRA project workflows and issue validation rules, improving sprint visibility, traceability, and reporting accuracy.
- Owned the complete hardware bring-up and validation loop — building Yocto images end-to-end, flashing target embedded boards, and running integration tests to verify pipeline-produced images boot correctly and the autonomous driving stack initialises as expected on physical hardware.

**Technologies:** GitLab CI/CD, Docker, Yocto, BitBake, Poky, OpenEmbedded, CMake, Colcon, ROS, Python, Bash, C++, Jira, Confluence

### Principal Software Engineer - C++ (Payments & Transactions) - Avanza Solutions (May 2024 - Sept 2024)
Pakistan

- Built microservices-based transaction flows for SWIFT P2P payments, enabling secure, low-latency cross-border payment processing at scale.
- Developed high-availability gateway services to increase transactions per second (TPS) for concurrent financial workloads, improving system throughput under peak load.
- Supported government monetary certification for payment compliance, coordinating with regulatory bodies to meet national payment authority mandates.
- Integrated financial middleware with bank systems and passed SWIFT payment certification.
- Worked directly with local and international clients from requirements gathering through go-live support.

**Technologies:** C++, C#, ISO 8583, ISO 20022, Jenkins, REST API, SOAP, Message Queues

### Senior C++ Software Engineer - BMW Infotainment Systems - Critical Techworks (BMW Group) (Oct 2023 - Apr 2024)
Porto, Portugal

- Improved system reliability of the BMW infotainment platform by designing and implementing recovery features for unexpected shutdown scenarios, reducing unplanned downtime.
- Integrated unit testing frameworks and automated build validation using Zuul CI, increasing test coverage and catching regressions earlier in the development pipeline.
- Designed mockups and unit tests to raise code coverage and ensure reliability of the infotainment display for next-generation BMW vehicles.
- Participated in code reviews and drove code-quality improvements across the team.

**Technologies:** C++, Python, Yocto, Microservices, GTest, GMock, Zuul CI, Jenkins, Git, Kanban

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

**Named client projects:**
- **Al Baraka Symmetry** — integrated financial middleware with the bank's switch (Euronet domestic and AutoSoft local APIs) for financial and non-financial transactions; merchant-presented QR SDK integration and Al Baraka fund transfer.
- **ADIB Bill Payment Upgrade** — bill payment and financial middleware upgrade with an alert notification mechanism at Abu Dhabi Islamic Bank, integrating UAE biller companies.
- **Meezan Bank EFT & IBFT switch migration** — migrated the existing payment switch to the 1Link authentic switch for EFT and IBFT transactions.
- **Meezan Bank Ambit upgrade & standing instructions** — enabled internet banking for mobile wallet account customers, introducing a standing-instruction mechanism for scheduled financial transactions.
- **KICB financial notifications** — delivered the alert mechanism for financial transactions at Kyrgyz Investment and Credit Bank.

**Technologies:** C++, SOAP, REST, ISO 8583, NDC Protocol, EMV, PCI DSS

## Independent Projects
<!-- Projects outside of employment: freelance, open source, personal -->
<!-- Not present in the source CV - add any freelance, open-source, or personal work here -->

## Technical Skills

### Embedded & Build Systems
Yocto Project, BitBake, Poky, OpenEmbedded, BSP layer design, cross-compilation, embedded Linux, ROS2, CMake, Colcon

### DevOps & CI/CD
GitLab CI/CD, Jenkins, Zuul CI, Docker, Git, Bitbucket, SonarQube, GTest, GMock, pipeline optimisation, TDD/EDD, PlantUML

### Programming & Scripting
- **C++** (expert): STL, multithreading, modern C++ idioms
- **C** (proficient)
- **Python** (proficient): automation, build tooling
- **Bash** (proficient)
- **C#** (limited): one engagement - bank financial-middleware services at Avanza Solutions, 2024

### Payment Systems
ISO 8583, ISO 20022, EMV, PCI DSS, PA-DSS, mPOS, QR payments, VISA/MasterCard, SWIFT, NDC protocol

### Architectures & Integration
Microservices, design patterns, high-availability systems, SOAP, REST, SIP, RTP, ASAI, message queues, TCP/IP, IPC, SQL

### Top Skills (LinkedIn-endorsed)
Autonomous Vehicles, Automotive, Cross-Compilation

### Domain Expertise
- Autonomous driving / automotive embedded platforms
- Telecom contact centres and real-time VoIP telephony
- Banking, payments, and transaction switching

### Cloud & Process
AWS, Agile, Scrum, Kanban, Jira, Confluence, Slack, distributed/remote teamwork

## Certifications

### Completed
- **Solid Principles for Software Design & Architecture** (2023)
- **Test-Driven Development in C++**
- **Advanced Design Patterns: Design Principles**
- **MERN Essential Training**

### In progress
- **AWS Certified Solutions Architect – Associate** — currently studying
- **NVIDIA AI Infrastructure** — currently studying

<!-- Completed certifications came from the LinkedIn export, not the CV. The Duolingo German
Fluency (Elementary) certification is deliberately omitted, consistent with not declaring German. -->

## Publications
<!-- Not present in the source CV -->

## Awards
- **NGIRI funding for Final Year Project** — National ICT R&D Fund (3D Handheld Scanner using Leap Motion)

## References
<!-- Not present in the source CV -->

References available upon request.
