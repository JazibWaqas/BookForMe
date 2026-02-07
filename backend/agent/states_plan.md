# Implementation Plan: 5-Intent Architecture Transition

## 1. Executive Summary
Transitioning from 14 granular intents to 5 core intents is a **High-Impact, Low-Risk architectural improvement**. 

**Why it is beneficial:**
*   **Higher Accuracy:** Models (both LLMs and BERT) struggle to differentiate between nuanced overlaps like `booking_request` vs. `availability_inquiry`. Reduces "confusion" errors consistently.
*   **Simplified Logic:** Reducing 14 paths to 5 robust flows makes the codebase easier to debug and maintain.
*   **Business Alignment:** The 5 intents map 1:1 with the actual backend capabilities (Booking, Info, Confirmation).

**Risk Mitigation:**
*   **Reliance on Entities:** We move logic from "Intent" to "Entities". Requires ensuring Date/Time/Service extraction remains strong (which it currently is).

---

## 2. The New Intent Taxonomy
We will replace the 14 intents with these 5 Core Intents:

| New Intent | Covers Old Intents | Description |
| :--- | :--- | :--- |
| **`GREETING`** | `greeting` | Conversational openers, personality. |
| **`INQUIRY`** | `booking_request`, `availability_inquiry`, `service_selection`, `date_selection`, `time_selection` | Any user attempt to start or progress a booking. |
| **`INFO_REQUEST`** | `price_inquiry`, `information`, `payment_related` | Asking for static data (prices, rules, account info). |
| **`TRANSACTION`** | `confirmation`, `cancellation`, `modification` | Reacting to a specific proposal (Yes/No/Change). |
| **`UNKNOWN`** | `unknown`, `name_provided` | Fallback or irrelevant messages. |

---

## 3. Implementation Plan

### Step 1: Update Data Models
**File:** `backend/agent/models.py`
*   **Action:** Update the `Intent` Enum to reflect the 5 new keys.
*   **Reasoning:** This enforces type safety across the application.

### Step 2: Update NLU Prompts (Groq)
**File:** `backend/nlu/agent.py`
*   **Action:** Rewrite `_create_intent_prompt`.
*   **Details:** 
    *   Remove the 14-item list.
    *   Add the 5-item definitions with clear examples.
    *   *Self-Correction:* Ensure the prompt instructs the LLM that "Tomorrow" or "Padel" alone counts as `INQUIRY` (because it implies booking intent).

### Step 3: Update Routing Logic
**File:** `backend/agent/nodes.py`
*   **Action 1 (`route_by_intent`):** Map the 5 intents to the graph nodes.
    *   `inquiry` -> `query_availability` (The big funnel)
    *   `info_request` -> `query_info`
    *   `transaction` -> `check_confirmation` (or see special case below)
    *   `greeting` -> `generate_response`
    *   `unknown` -> `generate_response`
*   **Action 2 (`validate_state_node`):** Update the `required_fields` map.
    *   `inquiry`: Requires `['date']` (optional: `['service']`).
*   **Special case – TRANSACTION with explicit slot ID:** When the user says "confirm 20260208_0900_ace_3" (or any message that is both a transaction and contains a slot ID), we must **not** route to `check_confirmation` only. We need to resolve the slot first, then execute the booking. So:
    *   If intent is `transaction` **and** `selected_slot` has a `slot_id` (extracted from the message by `extract_slot_node`), route to **`query_availability`** instead of `check_confirmation`.
    *   In `query_availability_node` we use the slot ID to find the slot and set `pending_booking`; then `route_after_availability` sees `transaction` + `pending_booking.slot_id` and sends the flow to **`execute_booking`**.
    *   Result: one message "confirm 20260208_0900_ace_3" → query_availability (resolve slot) → execute_booking → user gets "Slot locked, send payment screenshot".
    *   This is documented in code in `route_by_intent`: "TRANSACTION with slot_id: route to query_availability to resolve slot then execute_booking".

### Step 4: Verification
**Test Cases to Verify:**
1.  **"Do you have a slot?"** -> `inquiry` -> Routing asks for date.
2.  **"Book tomorrow"** -> `inquiry` -> Params extracted -> Routing checks availability.
3.  **"How much is Padel?"** -> `info_request` -> Routing returns pricing.
4.  **"Yes confirm"** -> `transaction` -> Routing executes booking (when already awaiting confirmation).
5.  **"confirm 20260208_0900_ace_3"** -> Treated as `inquiry` in NLU (slot ID present) or `transaction` with slot_id in state -> `query_availability` -> `execute_booking` (special case).

## 4. Execution Order
1.  Verify exact file paths.
2.  Modify `models.py` (The backbone).
3.  Modify `nlu/agent.py` (The brain).
4.  Modify `nodes.py` (The flow).
5.  Manual Testing.
