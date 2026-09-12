# Product Requirements Document

## Product Overview

**Product:** RailOpt AI — Intelligent Railway Block Planning & Optimization  
**Problem Statement:** SIH26027 — AI-Powered Automatic Block Planning to Maximize Asset Availability for Train Operations on Indian Railways.

RailOpt AI is a decision-support system for coordinated railway maintenance block planning. It brings maintenance requests and operational information into a common planning workflow, assigns maintenance priority scores, and recommends feasible block schedules across Engineering, S&T, and Traction activities.

The MVP follows this operating principle:

> **AI recommends → Planner manages → Departments verify → Control Office gives final operational approval.**

The AI is not the authority responsible for railway operations.

The product should support weekly and monthly maintenance planning and provide visibility into train impact, conflicts, asset availability, and block utilization.

## Target Users

### Admin
- Manage users and roles.
- Manage departments.
- Manage system configuration.
- Manage plans.
- View/manage audit logs.

### Planner
- Create maintenance requests.
- Run AI optimization.
- Review and edit proposed blocks.
- Finalize maintenance plans.
- Manage planning in offline/manual mode when required.

### Control Office
- View timetable and operational conflicts.
- Review proposed/finalized blocks.
- Give final operational approval.
- Use essential planning capabilities in offline/manual mode when authorized.

### Department Engineers
- Engineering Engineer: create/update Engineering requests and approve assigned work.
- S&T Engineer: create/update S&T requests and approve assigned work.
- Traction Engineer: create/update Traction requests and approve assigned work.
- Authorized department users can continue essential planning in offline/manual mode when required.

## Problem Statement

Railway maintenance for fixed infrastructure is planned independently by Engineering, Traction Distribution, and Signal & Telecommunication departments. Maintenance requests are handled through systems including TMS, SMMS, and TDMS, while operational corridor/block availability is associated with COA/BDMS information.

The decentralized process can lead to inefficient block utilization, conflicting departmental work, avoidable train disruption, and reduced asset availability.

RailOpt AI addresses this by coordinating maintenance requirements with operational constraints and generating optimized block recommendations. The source PPT describes the intended unified view across TMS, SMMS, TDMS, and COA, AI-based priority scoring, timetable-aware optimization, and multi-department coordination. fileciteturn2file0L26-L65

## Goals

### MVP Goals
1. Provide role-based access for Admin, Planner, Control Office, and Engineering/S&T/Traction engineers.
2. Consolidate available maintenance and operational data into a planning view.
3. Generate a priority score for maintenance work based on the agreed maintenance-priority factors.
4. Generate feasible block recommendations.
5. Coordinate compatible work from multiple departments into shared blocks where feasible.
6. Respect all defined hard safety and operational constraints.
7. Optimize for:
   - maximizing asset availability,
   - maximizing maintenance-block utilization,
   - minimizing train-operation disruption.
8. Support planner review, manual editing, and finalization of AI recommendations.
9. Require assigned department verification before planner finalization.
10. Require final operational approval from the Control Office.
11. Provide weekly and monthly planning outputs.
12. Provide an offline/manual workflow using the latest synchronized data when the system or network is unavailable.
13. After recovery, synchronize offline changes, perform conflict checking, and record the relevant actions in the audit log.

## Non-Goals

The MVP will not:
- Give AI autonomous authority to approve or execute railway blocks.
- Override safety or operational constraints.
- Automatically execute physical railway maintenance or train-control operations.
- Require real railway API access for the prototype to function.
- Implement IoT-based real-time monitoring.
- Implement predictive maintenance based on live sensor data.
- Claim pan-India production deployment.
- Replace existing railway operational systems.
- Introduce requirements for data sources or workflows not specified by the project team or SIH problem statement.

## Core Features

### 1. Role-Based Access
The system must enforce permissions according to the defined roles and prevent users from performing actions outside their role.

### 2. Maintenance Request Management
Department engineers can create and update requests for their department. Planners can create maintenance requests and manage planning inputs.

Maintenance information may include defects, overdue work, maintenance history/status, and department-specific maintenance requirements where such data is available.

### 3. Unified Planning Data
The planning view should combine relevant information from:
- TMS
- SMMS
- TDMS
- COA/BDMS
- Timetable and goods-train forecast information
- Corridor/block availability

For the prototype, realistic simulated data must be available when actual railway APIs/data are unavailable.

### 4. AI-Based Maintenance Priority Scoring
The system must assign a priority score/ranking to maintenance work using relevant factors identified for the project, including:
- severity,
- overdue status,
- safety risk,
- asset criticality,
- traffic impact.

The source PPT identifies these factors as the intended priority dimensions. fileciteturn2file0L170-L184

The MVP must make the resulting priority understandable to the planner rather than presenting an unexplained score.

### 5. AI-Assisted Block Optimization
The system must generate recommended blocks from maintenance requests while enforcing hard constraints.

Hard constraints include:
- no conflict with scheduled passenger trains,
- goods-train forecast,
- corridor availability,
- maintenance duration,
- department/resource availability,
- safety and maintenance rules.

The optimization may combine compatible Engineering, S&T, and Traction work into a common block when the work is feasible together.

### 6. Optimization Objective
Among feasible schedules, the system should balance:
- asset availability,
- maintenance-block utilization,
- train-operation disruption.

No optimization result may violate hard safety or operational constraints.

### 7. Timetable and Conflict View
Users with the required permissions must be able to see relevant timetable information and identify conflicts affecting proposed blocks.

### 8. Planner Review and Editing
After optimization:
1. AI generates the recommendation.
2. Planner reviews the recommendation.
3. Planner can edit blocks.
4. Department engineers verify assigned work.
5. Planner finalizes the plan.
6. Control Office reviews it.
7. Control Office gives final operational approval.

### 9. Weekly and Monthly Planning
The system must generate and present maintenance plans for weekly and monthly planning horizons.

### 10. Offline/Manual Mode
When the system or network is unavailable:
1. Authorized users can continue essential planning using the latest synchronized data.
2. Planner can manually manage blocks.
3. Departments verify work.
4. Control Office approves.
5. When connectivity/system availability returns, offline changes are synchronized.
6. The recovered state is checked for conflicts.
7. Relevant actions are recorded in the audit log.

Offline mode is a continuity mechanism; it does not grant users permissions they do not normally have.

### 11. Auditability
The system must retain an audit history for significant planning and approval actions, including changes and approvals, so that the final plan can be traced through the workflow.

## User Flows

### Flow 1 — Normal Online Planning

1. Authorized user signs in.
2. User accesses information permitted by their role.
3. Maintenance requests and operational data are available to the planning workflow.
4. Planner reviews maintenance priorities.
5. Planner runs AI optimization.
6. System generates feasible block recommendations.
7. Planner reviews and edits recommendations if necessary.
8. Assigned department engineers verify their work.
9. Planner finalizes the plan.
10. Control Office reviews timetable/conflicts and the plan.
11. Control Office gives final operational approval.
12. Approved plan proceeds to block execution/tracking.

### Flow 2 — Department Maintenance Request

1. Department engineer signs in.
2. Engineer creates or updates a request for their department.
3. Request becomes available to the planning workflow.
4. Planner considers the request during priority scoring and block optimization.
5. If assigned to a block, the department engineer verifies the assigned work.

### Flow 3 — Offline/Manual Planning

1. System/network becomes unavailable.
2. Authorized user enters offline/manual mode.
3. Latest synchronized data is used.
4. Planner manually manages required blocks.
5. Departments verify assigned work.
6. Control Office gives operational approval.
7. System/network recovers.
8. Offline changes synchronize.
9. System performs conflict checking.
10. Relevant changes/actions are added to the audit history.

### Flow 4 — AI Recommendation With Constraint Protection

1. Planner requests optimization.
2. System evaluates maintenance requests against available planning windows.
3. System rejects/avoids infeasible options that violate hard constraints.
4. System compares feasible alternatives using the optimization objective.
5. System presents recommended blocks and relevant trade-offs to the planner.
6. Planner remains responsible for reviewing the recommendation.

## Future Features

The following are future scope and are not required for the MVP:
- Real-time IoT/sensor monitoring.
- Predictive maintenance using asset-condition/sensor data.
- Continuous real-time block re-optimization.
- Pan-India railway-zone expansion.
- Advanced train and goods-traffic forecasting.
- Broader integration into a digital railway ecosystem.

These future directions are consistent with the future prospects identified in the submitted PPT. fileciteturn2file0L138-L154

## Technical Constraints

Only confirmed project constraints are listed here:

1. The product is a **software** solution for the SIH26027 Transportation & Logistics problem.
2. The system should be usable with actual railway APIs/data **if such access is available to the team**.
3. If actual railway APIs/data are unavailable, the MVP must work with realistic simulated data.
4. The MVP must support offline/manual planning using the latest synchronized data.
5. AI must never violate hard safety or operational constraints.
6. Role permissions defined in this PRD must be enforced.
7. The source project proposal identifies a web-based application, Python AI/optimization engine, PostgreSQL database, and REST APIs, but these are retained as project constraints only to the extent the team has committed to them in the submitted proposal. fileciteturn2file0L92-L103

**Assumption:** No specific railway API endpoint, authentication mechanism, data contract, railway zone, or production integration credential has been confirmed. Therefore, the PRD does not require a particular external API implementation.

## Success Metrics

The MVP should be evaluated using measurable planning outcomes:

1. **Constraint compliance:** 100% of generated recommended blocks satisfy defined hard safety and operational constraints in the test dataset.
2. **Priority scoring:** 100% of eligible maintenance requests receive a priority score/ranking.
3. **Plan generation:** A planner can generate a weekly and monthly plan from the available dataset.
4. **Workflow completion:** A generated plan can progress through planner review, department verification, and Control Office final operational approval.
5. **Multi-department coordination:** The system can identify and combine compatible work from multiple departments where constraints permit.
6. **Conflict visibility:** Timetable/block conflicts affecting proposed plans are visible to authorized users.
7. **Offline continuity:** Authorized users can perform defined essential planning actions using the latest synchronized data during simulated system/network unavailability.
8. **Recovery integrity:** After recovery, offline changes are synchronized and checked for conflicts before the recovered plan is treated as current.
9. **Auditability:** Significant plan changes and approval actions are traceable in the audit history.
10. **Optimization outcome:** On a defined test dataset, the optimized plan demonstrates improvement against a documented baseline according to asset availability, block utilization, and train-disruption objectives.

## Acceptance Criteria

### Access and Roles
- [ ] Admin can manage users, roles, departments, system configuration, plans, and audit logs.
- [ ] Planner can create maintenance requests, run optimization, review/edit blocks, and finalize plans.
- [ ] Control Office can view timetable/conflicts, review plans, and give final operational approval.
- [ ] Engineering, S&T, and Traction engineers can create/update their own departmental requests and approve assigned work.
- [ ] Unauthorized role actions are blocked.

### Data
- [ ] Planning workflow can consume available railway data when actual approved access exists.
- [ ] Realistic simulated data can be used when actual APIs/data are unavailable.
- [ ] Planning data includes the required maintenance and operational information needed by the MVP.

### Priority Scoring
- [ ] Eligible maintenance requests receive a priority score/ranking.
- [ ] Priority considers severity, overdue status, safety risk, asset criticality, and traffic impact where the corresponding data is available.
- [ ] Planner can understand the factors contributing to a recommendation.

### Block Optimization
- [ ] AI generates block recommendations from eligible maintenance work.
- [ ] Generated recommendations do not violate hard safety or operational constraints.
- [ ] Passenger-train conflicts are prevented.
- [ ] Goods-train forecast information is considered.
- [ ] Corridor availability is considered.
- [ ] Maintenance duration is respected.
- [ ] Department/resource availability is respected.
- [ ] Safety and maintenance rules are respected.
- [ ] Compatible multi-department work can be combined where feasible.
- [ ] Optimization considers asset availability, block utilization, and train-operation disruption.

### Planning Workflow
- [ ] Planner can review and edit AI-generated blocks.
- [ ] Assigned department engineers can verify their work.
- [ ] Planner can finalize the plan only after the required verification workflow is satisfied.
- [ ] Control Office can review the final plan and relevant conflicts.
- [ ] Only Control Office approval can complete the defined final operational approval step.
- [ ] Weekly plans can be generated.
- [ ] Monthly plans can be generated.

### Offline and Recovery
- [ ] Authorized users can enter offline/manual mode when the system/network is unavailable.
- [ ] Offline planning uses the latest synchronized data.
- [ ] Planner can manually manage blocks offline.
- [ ] Department verification and Control Office approval remain part of the offline workflow.
- [ ] On recovery, offline changes are synchronized.
- [ ] Recovered data is checked for conflicts.
- [ ] Significant offline/recovery actions are recorded in the audit history.

### Safety and Authority
- [ ] AI recommendations cannot bypass hard safety or operational constraints.
- [ ] AI cannot independently give final operational approval.
- [ ] The final operational approval remains with the Control Office.
- [ ] The system clearly distinguishes AI recommendations from human decisions.
