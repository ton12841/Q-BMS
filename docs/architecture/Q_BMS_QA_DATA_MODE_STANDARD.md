# Q BMS QA Data Mode Standard

Every Q BMS Tool should support a clearly separated Development/QA Data Mode when realistic workflow testing is needed before production integrations are available.

Rules:
1. QA Data is visibly labelled and must not be confused with Real Data.
2. QA mutations must not contaminate production tables, reports or dashboards.
3. Role/Scope Preview may be interactive only against QA data; on Real Data it remains read-only unless the actual access grants the action.
4. Shared masters and external tools that are not built yet may use explicit temporary adapters/selectors in QA only. Do not create duplicate production masters inside the consuming Tool.
5. QA simulations of external dependencies must be visibly labelled as simulators and must preserve the intended production ownership boundary.
6. Resetting QA data must never reset Real Data.
7. QA functionality must be disabled from production builds unless deliberately productized later.
