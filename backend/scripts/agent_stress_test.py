"""
Agent Stress Test - Industry standard test cases for the booking agent
Tests: English, Urdu, mixed, booking flow, area filter, date changes
"""

import asyncio
import sys
import os
import re

script_dir = os.path.dirname(os.path.abspath(__file__))
try:
    if hasattr(sys.stdout, "reconfigure") and sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("LOG_LEVEL", "WARNING")

from agent.session_store import session_store
from agent.graph import BookingAgent


def clear_session(phone: str):
    session_store.clear_session(phone)


def assert_contains(response: str, substrings: list, msg: str) -> bool:
    for s in substrings:
        if s.lower() in response.lower():
            return True
    return False


async def run_turn(agent: BookingAgent, phone: str, msg: str, history: list) -> str:
    resp = await agent.process(phone, msg, history)
    return resp or ""


async def run_test():
    agent = BookingAgent()
    phone = "+923009998877"
    history = []
    results = []

    def ok(name: str, msg: str, resp: str, checks: list):
        passed = all(c(resp) for c in checks)
        results.append({"name": name, "pass": passed, "msg": msg, "resp": resp[:200]})
        return resp

    clear_session(phone)

    print("\n=== 1. GREETINGS ===\n")

    r = await run_turn(agent, phone, "Hi", history)
    history = history + [{"role": "user", "content": "Hi"}, {"role": "assistant", "content": r}]
    ok("English greeting", "Hi", r, [
        lambda x: "hi" in x.lower() or "help" in x.lower(),
        lambda x: len(x) > 20
    ])
    print(f"Hi -> {r[:150]}...")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "Aoa", history)
    history = history + [{"role": "user", "content": "Aoa"}, {"role": "assistant", "content": r}]
    ok("Urdu greeting", "Aoa", r, [
        lambda x: "aoa" in x.lower() or "salam" in x.lower() or "help" in x.lower(),
        lambda x: "padel" in x.lower() or "booking" in x.lower() or "cricket" in x.lower() or "futsal" in x.lower()
    ])
    print(f"Aoa -> {r[:150]}...")

    print("\n=== 2. GENERIC QUERY (should ask for time) ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel kal slot", history)
    history = history + [{"role": "user", "content": "padel kal slot"}, {"role": "assistant", "content": r}]
    ok("Generic query asks time", "padel kal slot", r, [
        lambda x: "time" in x.lower() or "morning" in x.lower() or "evening" in x.lower() or "shaam" in x.lower()
    ])
    print(f"padel kal slot -> {r[:200]}...")

    print("\n=== 3. COMPLETE QUERY (date + time + sport) ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel tomorrow evening", history)
    history = history + [{"role": "user", "content": "padel tomorrow evening"}, {"role": "assistant", "content": r}]
    has_slots = "slot" in r.lower() and ("rs" in r.lower() or "1." in r or "2." in r or "---" in r)
    has_no_slots = "nahi" in r.lower() or "no slot" in r.lower() or "available" in r.lower()
    ok("Complete query shows slots or no-slots", "padel tomorrow evening", r, [
        lambda x: len(x) > 30,
        lambda x: has_slots or has_no_slots or "slot" in x.lower()
    ])
    print(f"padel tomorrow evening -> {r[:250]}...")

    if has_slots and ("1." in r or "2." in r or "Reply with the number" in r):
        print("\n=== 4. NUMERIC SELECTION (2) ===\n")
        r2 = await run_turn(agent, phone, "2", history + [])
        history = history + [{"role": "user", "content": "2"}, {"role": "assistant", "content": r2}]
        ok("Numeric 2 -> confirmation", "2", r2, [
            lambda x: "yes" in x.lower() or "reserve" in x.lower() or "confirm" in x.lower()
        ])
        print(f"2 -> {r2[:200]}...")

        print("\n=== 5. CONFIRMATION (yes) ===\n")
        r3 = await run_turn(agent, phone, "yes", history + [])
        ok("yes -> lock or confirmed", "yes", r3, [
            lambda x: "locked" in x.lower() or "transfer" in x.lower() or "rs" in x.lower() or "confirm" in x.lower()
        ])
        print(f"yes -> {r3[:200]}...")

    print("\n=== 6. AREA-SPECIFIC QUERY ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel tomorrow evening in DHA", history)
    ok("Area DHA", "padel tomorrow evening in DHA", r, [lambda x: len(x) > 20])
    print(f"DHA -> {r[:200]}...")

    print("\n=== 7. AREA NOT IN DB (may fail gracefully) ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel tomorrow evening in Antarctica", history)
    ok("Invalid area", "Antarctica", r, [
        lambda x: len(x) > 10,
        lambda x: "vendor" in x.lower() or "nahi" in x.lower() or "slot" in x.lower() or "try" in x.lower()
    ])
    print(f"Antarctica -> {r[:200]}...")

    print("\n=== 8. CANCEL FLOW ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel kal shaam", history)
    history = [{"role": "user", "content": "padel kal shaam"}, {"role": "assistant", "content": r}]
    if "1." in r or "2." in r:
        r2 = await run_turn(agent, phone, "2", history)
        history = history + [{"role": "user", "content": "2"}, {"role": "assistant", "content": r2}]
        r3 = await run_turn(agent, phone, "no", history)
        ok("no cancels", "no", r3, [
            lambda x: "cancel" in x.lower() or "nahi" in x.lower() or "no problem" in x.lower() or "aur" in x.lower()
        ])
        print(f"no -> {r3[:150]}...")

    print("\n=== 9. MIXED LANGUAGE ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "kal evening padel chahiye", history)
    ok("Mixed UR/EN", "kal evening padel chahiye", r, [lambda x: len(x) > 20])
    print(f"Mixed -> {r[:200]}...")

    print("\n=== 10. DATE VARIATIONS ===\n")

    for q in ["padel today evening", "padel Friday night", "futsal 15 feb morning"]:
        clear_session(phone)
        r = await run_turn(agent, phone, q, [])
        ok(f"Date: {q[:30]}", q, r, [lambda x: len(x) > 15])
    print("Date variants tested.")

    print("\n=== 11. PRICE INQUIRY ===\n")

    clear_session(phone)
    r = await run_turn(agent, phone, "kitna hai price?", [])
    ok("Price inquiry", "kitna hai price?", r, [
        lambda x: "rs" in x.lower() or "price" in x.lower() or "rate" in x.lower() or "charge" in x.lower()
    ])
    print(f"Price -> {r[:150]}...")

    print("\n=== 12. INCOMPLETE (koi slot hei) ===\n")

    clear_session(phone)
    r = await run_turn(agent, phone, "koi slot hei?", [])
    ok("Incomplete query", "koi slot hei?", r, [
        lambda x: len(x) > 20,
        lambda x: "date" in x.lower() or "time" in x.lower() or "kal" in x.lower() or "slot" in x.lower()
    ])
    print(f"koi slot hei -> {r[:150]}...")

    print("\n=== 13. EVENING SHOWS LIST (not auto-confirm) ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel tomorrow evening", [])
    is_list = "1." in r and "2." in r
    is_not_confirm = "reply 'yes' to reserve" not in r.lower() or "1." in r
    ok("Evening shows numbered list", "padel tomorrow evening", r, [
        lambda x: "1." in x and "2." in x,
    ])
    print(f"Evening list -> {'LIST' if is_list else 'CONFIRM (BUG)'}  {r[:200]}...")

    print("\n=== 14. MORNING SHOWS LIST (not auto-confirm) ===\n")

    clear_session(phone)
    r = await run_turn(agent, phone, "padel tomorrow morning", [])
    ok("Morning shows numbered list", "padel tomorrow morning", r, [
        lambda x: "1." in x and "2." in x,
    ])
    print(f"Morning list -> {r[:200]}...")

    print("\n=== 15. NEW INQUIRY CLEARS OLD CONFIRMATION ===\n")

    clear_session(phone)
    history = []
    r = await run_turn(agent, phone, "padel tomorrow evening", [])
    history = [{"role": "user", "content": "padel tomorrow evening"}, {"role": "assistant", "content": r}]
    if "1." in r:
        r2 = await run_turn(agent, phone, "1", history)
        history += [{"role": "user", "content": "1"}, {"role": "assistant", "content": r2}]
        r3 = await run_turn(agent, phone, "show me morning slots", history)
        is_new = "1." in r3 or "morning" in r3.lower() or "time" in r3.lower()
        ok("New inquiry clears old confirm", "show me morning slots", r3, [
            lambda x: "1." in x or "morning" in x.lower() or "time" in x.lower()
        ])
        print(f"New inquiry -> {r3[:200]}...")

    print("\n=== 16. NO DUPLICATE TIMES ===\n")

    clear_session(phone)
    r = await run_turn(agent, phone, "show all padel slots tomorrow", [])
    lines = [l.strip() for l in r.split("\n") if l.strip().startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9."))]
    times = [l.split("—")[0].split(".", 1)[-1].strip() if "—" in l else "" for l in lines]
    vendor_times = {}
    cur_vendor = ""
    for line in r.split("\n"):
        if line.strip().startswith("**") and "(" in line:
            cur_vendor = line.strip()
        if re.match(r"\s+\d+\.", line) and "—" in line:
            t = line.split("—")[0].split(".", 1)[-1].strip()
            vendor_times.setdefault(cur_vendor, []).append(t)
    has_dupes = any(len(ts) != len(set(ts)) for ts in vendor_times.values() if ts)
    ok("No duplicate times per vendor", "show all padel slots", r, [
        lambda x: not has_dupes,
    ])
    print(f"Duplicates: {'YES (BUG)' if has_dupes else 'NONE'}  Vendors: {len(vendor_times)}")

    print("\n" + "=" * 60)
    print("STRESS TEST SUMMARY")
    print("=" * 60)
    passed = sum(1 for x in results if x["pass"])
    total = len(results)
    print(f"\nPassed: {passed}/{total}\n")
    for r in results:
        s = "[PASS]" if r["pass"] else "[FAIL]"
        print(f"  {s} {r['name']}")
        if not r["pass"]:
            print(f"       resp: {r['resp'][:80]}...")
    print()
    return passed == total


if __name__ == "__main__":
    success = asyncio.run(run_test())
    sys.exit(0 if success else 1)
