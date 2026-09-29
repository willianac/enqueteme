# AI Use Cases for Enqueteme

This document outlines potential AI capabilities and use cases for the Enqueteme polling platform, evaluating their product impact, implementation complexity, and alignment with the application lifecycle.

---

## Overview

While basic natural-language poll generation ("Prompt to Poll") is a common starting point, its real-world utility can be limited if typing the prompt takes as much effort as typing the poll question itself. High-value AI integrations focus instead on:

1. **Improving poll quality and fairness** (helping creators).
2. **Contextualizing decisions** (helping voters make informed choices).
3. **Reducing platform fragmentation & friction** (duplicate prevention, smart ingestion).
4. **Delivering post-vote intelligence** (meaningful summaries of results).

---

## Use Cases by Lifecycle Stage

### 1. Creation & Authoring

#### A. "Prompt to Poll" & Option Co-Pilot
* **Concept:** The user provides a brief topic or question (e.g., *"Best database for real-time analytics"*), and the AI suggests balanced, mutually exclusive, collectively exhaustive (MECE) options.
* **Value:** Reduces friction when thinking through relevant choices or formatting options.
* **Implementation:** NestJS endpoint receiving a topic prompt and returning a structured JSON schema `{ title: string, options: string[] }`.

#### B. Neutrality & Bias Inspector (Quality Guard)
* **Concept:** As the creator writes a question and options, the AI inspects the draft for cognitive biases and design flaws:
  * **Leading Questions:** Detects phrasing that nudges voters (e.g., *"Don't you agree that TypeScript is essential?"* -> suggests *"What is your preference regarding TypeScript adoption?"*).
  * **Missing Alternatives:** Flags omitted common answers (e.g., listing PostgreSQL and MySQL, but omitting SQLite or MariaDB).
  * **Missing Escape Hatches:** Recommends adding a *"None of the above"* or *"See results"* option to prevent skewed datasets.
* **Value:** Raises the overall trustworthiness and analytical quality of community polls.

#### C. "Content-to-Poll" (URL & Text Ingestion)
* **Concept:** The creator inputs an article URL, release notes, or raw meeting notes. The AI extracts the core dilemma or debate and formulates a poll question with pertinent options.
* **Example:** Ingesting a framework release document automatically yields: *"Which new feature are you most likely to adopt first?"* with key highlighted features as choices.
* **Value:** Enables rapid poll generation from existing articles, PRs, and team documentation.

---

### 2. Voting & Voter Experience

#### A. "Explain the Debate" (Context Briefing)
* **Concept:** Voters often encounter niche or technical polls where they lack background context (e.g., *"Should we implement strict CSP or report-only?"*). A dedicated *"Explain"* action provides an objective, balanced modal/tooltip:
  * A 1–2 sentence overview of why this issue is actively debated.
  * Bulleted pros & cons for each option.
  * **Strict Neutrality:** Guardrails ensuring the model never advises the voter which option to pick.
* **Value:** Drives engagement among passive users who would otherwise skip voting due to lack of domain knowledge.

---

### 3. Platform Health & Discovery

#### A. Semantic Duplicate Detection
* **Concept:** When a creator starts drafting a title, an embedding or semantic search checks existing open polls.
* **Behavior:** Shows a non-blocking banner: *"A similar poll is currently active with 320 votes: [Link]. Consider voting or participating there."*
* **Value:** Prevents vote splitting on popular topics (e.g., *"React vs. Vue"*) and keeps community engagement concentrated.

#### B. Zero-Effort Smart Categorization & Tagging
* **Concept:** Automatically generates searchable tags (`#frontend`, `#database`, `#devops`) upon poll creation without requiring cumbersome dropdown selectors.
* **Value:** Keeps discovery tidy without adding friction to the poll creation workflow.

#### C. Automated Content Moderation & Spam Guard
* **Concept:** Pre-submission check against toxic phrasing, hate speech, spam links, or phishing attempts.
* **Value:** Protects public platforms without requiring manual moderator review for every submission.

---

### 4. Post-Vote Analytics & Insights

#### A. Result Summary & Key Takeaways
* **Concept:** Once a poll concludes or reaches statistical significance, the AI drafts an executive summary of the outcome (e.g., *"Option A won a 60% majority; however, voting velocity showed late momentum for Option B"*).
* **Value:** Transforms raw percentages into clear, shareable takeaways for retrospectives or presentations.

#### B. Sentiment & Reason Clustering (Future Feature)
* **Concept:** If comments or optional "reason for vote" text fields are added to the platform, AI groups responses into sentiment buckets and common themes.

---

## Evaluation Matrix

| Use Case | Implementation Complexity | Impact / Value | Recommended Phase |
| :--- | :--- | :--- | :--- |
| **Option Co-Pilot / Neutrality Checker** | Low (single JSON prompt) | ⭐⭐⭐⭐⭐ | MVP / Phase 1 |
| **"Explain the Debate" Briefing** | Low (single prompt per poll) | ⭐⭐⭐⭐⭐ | MVP / Phase 1 |
| **Content-to-Poll (URL/Text Ingestion)** | Medium (parsing + prompt) | ⭐⭐⭐⭐ | Phase 2 |
| **Semantic Duplicate Detection** | Medium (embeddings / vector search) | ⭐⭐⭐⭐ | Phase 2 (post-growth) |
| **Result Summary & Takeaways** | Low (structured analysis) | ⭐⭐⭐ | Phase 2 |
| **Automated Categorization / Tags** | Low (tag extraction) | ⭐⭐⭐ | When categories are added |

---

## Suggested Next Steps

1. **Option Co-pilot & Neutrality Warning:** Integrate a lightweight AI helper directly into the poll creation modal in `web/` backed by a dedicated endpoint in `api/`.
2. **"Explain the Debate" Drawer:** Add an informational helper icon to the poll details view that opens a neutral briefing drawer for voters.
