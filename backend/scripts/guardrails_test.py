"""
Guardrails Test - Validates vulgarity detection, off-topic blocking,
and correct pass-through of legitimate booking messages.

Split into two parts:
  Part 1: Fast unit tests using check_guardrails() directly (no API calls)
  Part 2: Live agent tests for blocked messages only (fast, no NLU needed)
"""

import asyncio
import sys
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
try:
    if hasattr(sys.stdout, "reconfigure") and sys.stdout.encoding and sys.stdout.encoding.lower() != "utf-8":
        sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass
backend_dir = os.path.dirname(script_dir)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

os.environ.setdefault("LOG_LEVEL", "ERROR")

from agent.nodes import (
    BOOKING_WINDOW_DAYS,
    check_guardrails,
    normalize_date,
    _extract_fast_date_text,
    _detect_tx_input,
    _extract_slot_selection_number,
    _format_availability_response,
    _booking_policy_error,
)
from agent.session_store import session_store
from agent.graph import BookingAgent

VULGAR_MSG = "please keep"
BLOCK_SNIPPETS = ("bookings", "booking", "book", "slots", "sports", "court")

phone = "+923001112233"
results = []


def record(name, passed, detail=""):
    tag = "[PASS]" if passed else "[FAIL]"
    print(f"  {tag} {name}")
    if detail:
        print(f"        {detail}")
    if not passed:
        print(f"        ^^^ UNEXPECTED")
    results.append({"name": name, "pass": passed})


def has_blocking_redirect(text):
    lower = (text or "").lower()
    return any(snippet in lower for snippet in BLOCK_SNIPPETS)


def part1_unit_tests():
    print("\n" + "=" * 60)
    print("PART 1: UNIT TESTS (check_guardrails function)")
    print("=" * 60)

    print("\n--- 1A: Should return 'vulgar' ---\n")
    vulgar = [
        ("Basic profanity", "fuck off"),
        ("Profanity 2", "you're such a bitch"),
        ("Mild profanity", "this is bullshit"),
        ("Profanity + booking words", "fuck padel cancel this shit"),
        ("Aggressive", "damn you stupid bot"),
        ("Slur variation", "what the f*ck"),
    ]
    for name, msg in vulgar:
        result = check_guardrails(msg)
        record(name, result == "vulgar", f"'{msg}' -> {result}")

    print("\n--- 1B: Should return 'off_topic' ---\n")
    offtopic = [
        ("Weather", "whats the weather like"),
        ("Food", "give me a pizza recipe"),
        ("Joke", "tell me a joke"),
        ("Gibberish", "asdfghjkl qwerty"),
        ("President", "who is the president of USA"),
        ("Math", "solve x squared plus five"),
        ("Math digits", "what's 9+5"),
        ("Math words", "what is 9 plus 5"),
        ("Movie", "recommend a good movie"),
        ("Personal", "how old are you"),
        ("Code", "write me a python script"),
        ("Philosophy", "what is the meaning of life"),
        ("Song lyrics", "never gonna give you up"),
        ("Random sentence", "the quick brown fox jumps over"),
        ("Romantic despite booking word", "give me a virtual kiss after my padel game"),
        ("Joke despite booking word", "tell me a joke after padel"),
        ("Code despite booking word", "write me a python script to book padel"),
    ]
    for name, msg in offtopic:
        result = check_guardrails(msg)
        record(name, result == "off_topic", f"'{msg}' -> {result}")

    print("\n--- 1C: Should return None (pass through) ---\n")
    legit = [
        ("Greeting hi", "hi"),
        ("Sport query", "padel tomorrow evening"),
        ("Play padel", "play padel tomorrow"),
        ("Urdu booking", "kal shaam padel chahiye"),
        ("Cricket", "cricket slots for friday"),
        ("Futsal", "futsal available today?"),
        ("Slot number", "3"),
        ("Yes", "yes"),
        ("No", "no"),
        ("Morning", "morning slots"),
        ("Price urdu", "kitna price hai?"),
        ("Vendor", "smash padel?"),
        ("Area", "DHA me koi slot?"),
        ("Show all", "show me all slots"),
        ("Cancel", "cancel my booking"),
        ("Date", "15 feb ko padel"),
        ("Time", "3 pm slot"),
        ("Mixed", "kal evening padel book karna hai"),
        ("Book no dot", "please book no.7"),
        ("Book number", "book 7"),
        ("Slot number phrase", "slot 7"),
        ("Number 1", "1"),
        ("Number 10", "10"),
        ("Generic", "koi slot hei?"),
        ("Time range", "show me 5-6 pm slot"),
        ("Two digit select", "24"),
        ("Aoa greeting", "Aoa"),
        ("Short msg", "ok"),
        ("Just punctuation", "??"),
        ("Empty-ish", "  "),
        ("Single letter", "a"),
    ]
    for name, msg in legit:
        result = check_guardrails(msg)
        record(name, result is None, f"'{msg}' -> {result}")

    print("\n--- 1D: Edge cases ---\n")
    edges = [
        ("Frustration + slot word", "just show me the damn slots", "vulgar"),
        ("Urdu frustration clean", "yaar koi slot nahi milta", None),
        ("Number 42", "42", None),
        ("Empty string", "", None),
        ("Booking anger", "WHY WONT YOU CANCEL MY BOOKING", None),
    ]
    for name, msg, expected in edges:
        result = check_guardrails(msg)
        record(name, result == expected, f"'{msg}' -> {result} (expected {expected})")

    print("\n--- 1E: Mid-booking guardrail nuance ---\n")
    mid_flow = [
        ("Mid-flow slot number", "7", None),
        ("Mid-flow book no.7", "please book no.7", None),
        ("Mid-flow repair", "Excuse me?", None),
        ("Mid-flow math", "what's 9+5", "off_topic"),
        ("Mid-flow joke", "tell me a joke instead", "off_topic"),
        ("Mid-flow romantic", "give me a virtual kiss after padel", "off_topic"),
        ("Mid-flow too late", "that's too late", "booking_clarify"),
        ("Mid-flow not that", "not that one", "booking_clarify"),
        ("Mid-flow other options", "anything else?", "booking_clarify"),
        ("Mid-flow too expensive", "too expensive", "booking_clarify"),
        ("Mid-flow no slots question", "no slots?", "booking_clarify"),
        ("Mid-flow same time", "same time tomorrow?", "booking_clarify"),
    ]
    for name, msg, expected in mid_flow:
        result = check_guardrails(msg, in_booking_context=True)
        record(name, result == expected, f"'{msg}' -> {result} (expected {expected})")

    print("\n--- 1F: Unsupported booking services ---\n")
    unsupported = [
        ("Salon", "can you book salon tomorrow"),
        ("Tennis", "tennis tomorrow evening"),
        ("Restaurant", "book a restaurant tomorrow"),
        ("Hyderabad padel", "padel in hyderabad tomorrow"),
        ("Gulberg padel", "padel in gulberg tomorrow"),
    ]
    for name, msg in unsupported[:3]:
        result = check_guardrails(msg)
        record(name, result == "unsupported_service", f"'{msg}' -> {result}")
    for name, msg in unsupported[3:]:
        result = check_guardrails(msg)
        record(name, result in {"unsupported_location", "unsupported_sport_area"}, f"'{msg}' -> {result}")

    unknown_vendors = [
        ("Capital Padel", "book capital padel tomorrow"),
        ("XYZ Padel", "book xyz padel tomorrow"),
        ("Known Ace Padel", "book ace padel tomorrow"),
    ]
    for name, msg in unknown_vendors:
        result = check_guardrails(msg)
        expected = None if name.startswith("Known") else "unknown_vendor"
        record(name, result == expected, f"'{msg}' -> {result} (expected {expected})")

    print("\n--- 1G: Transaction parsing ---\n")
    tx_cases = [
        ("Bare slot", "7", "slot_select", 7),
        ("Book number", "book 7", "slot_select", 7),
        ("Book no dot", "please book no.7", "slot_select", 7),
        ("No space number", "no 7", "slot_select", 7),
        ("Slot phrase", "slot 7", "slot_select", 7),
        ("Option hash", "option #7", "slot_select", 7),
        ("Plain cancel", "no", "cancel", None),
        ("Cancel word", "cancel", "cancel", None),
        ("Time should not be slot", "7 pm", None, None),
    ]
    for name, msg, expected_tx, expected_num in tx_cases:
        tx = _detect_tx_input(msg)
        num = _extract_slot_selection_number(msg)
        passed = tx == expected_tx and num == expected_num
        record(name, passed, f"'{msg}' -> tx={tx}, num={num} (expected {expected_tx}, {expected_num})")

    print("\n--- 1H: Availability display sorting ---\n")
    slots_text, slot_options = _format_availability_response({
        "success": True,
        "date": "2026-05-16",
        "sport_type": "padel",
        "area": "Karachi",
        "vendors": [
            {
                "vendor_name": "Beta Club",
                "vendor_address": "B",
                "slots": [
                    {"slot_id": "b_20", "slot_time": "20:00", "end_time": "21:00", "time_display": "20:00 - 21:00", "price": 1500},
                    {"slot_id": "b_18", "slot_time": "18:00", "end_time": "19:00", "time_display": "18:00 - 19:00", "price": 1800},
                ],
            },
            {
                "vendor_name": "Alpha Club",
                "vendor_address": "A",
                "slots": [
                    {"slot_id": "a_19", "slot_time": "19:00", "end_time": "20:00", "time_display": "19:00 - 20:00", "price": 1200},
                    {"slot_id": "a_18", "slot_time": "18:00", "end_time": "19:00", "time_display": "18:00 - 19:00", "price": 1100},
                ],
            },
        ],
    })
    option_times = [opt["slot_time"] for opt in slot_options]
    option_vendors = [opt["vendor_name"] for opt in slot_options]
    sorted_ok = option_times == ["18:00", "18:00", "19:00", "20:00"]
    vendor_visible = "Alpha Club" in (slots_text or "") and "Beta Club" in (slots_text or "")
    record("Chronological slot display", sorted_ok and vendor_visible, f"times={option_times}, vendors={option_vendors}")

    nearby_text, nearby_options = _format_availability_response({
        "success": True,
        "date": "2026-05-16",
        "sport_type": "padel",
        "area": "Karachi",
        "time_exact_unavailable": True,
        "requested_time": "06:00",
        "vendors": [
            {
                "vendor_name": "Early Club",
                "slots": [
                    {"slot_id": "e_00", "slot_time": "00:00", "end_time": "01:00", "time_display": "00:00 - 01:00", "price": 1500},
                    {"slot_id": "e_08", "slot_time": "08:00", "end_time": "09:00", "time_display": "08:00 - 09:00", "price": 1500},
                    {"slot_id": "e_01", "slot_time": "01:00", "end_time": "02:00", "time_display": "01:00 - 02:00", "price": 1500},
                ],
            },
        ],
    })
    nearby_times = [opt["slot_time"] for opt in nearby_options]
    record("Nearby slot display by distance", nearby_times[:3] == ["08:00", "01:00", "00:00"], f"times={nearby_times}, text={nearby_text.splitlines()[0] if nearby_text else ''}")

    jump_text, _ = _format_availability_response({
        "success": True,
        "date": "2026-05-18",
        "requested_date": "2026-05-17",
        "sport_type": "padel",
        "area": "Karachi",
        "vendors": [
            {
                "vendor_name": "Alpha Club",
                "slots": [
                    {"slot_id": "a_18", "slot_time": "18:00", "end_time": "19:00", "time_display": "18:00 - 19:00", "price": 1100},
                ],
            },
        ],
    })
    jump_ok = "No slots available on 2026-05-17" in (jump_text or "") and "2026-05-18" in (jump_text or "")
    record("Date-jump availability header", jump_ok, f"header={jump_text.splitlines()[0] if jump_text else ''}")

    print("\n--- 1I: Booking policy validation ---\n")
    yesterday = normalize_date("yesterday")
    far_future = "2099-01-01"
    policy_cases = [
        ("Past date", yesterday, {"start": "19:00", "end": "20:00"}, "past_date"),
        ("Too far ahead", far_future, {"start": "19:00", "end": "20:00"}, "too_far"),
        ("Early morning closed", normalize_date("tomorrow"), {"start": "03:00", "end": "05:00"}, "outside_hours"),
        ("Normal evening", normalize_date("tomorrow"), {"start": "19:00", "end": "20:00"}, None),
        ("Possible late weekend hour", normalize_date("tomorrow"), {"start": "01:00", "end": "02:00"}, None),
        ("Ordinal past date", normalize_date("11th May"), {"start": "19:00", "end": "20:00"}, "past_date"),
        ("Month-day past date", normalize_date("May 11"), {"start": "19:00", "end": "20:00"}, "past_date"),
        ("Relative too far", normalize_date("4 weeks from now"), {"start": "19:00", "end": "20:00"}, "too_far"),
        ("Next week allowed", normalize_date("next week"), {"start": "19:00", "end": "20:00"}, None),
    ]
    for name, date_value, time_range, expected in policy_cases:
        result = _booking_policy_error(date_value, time_range)
        got = result.get("type") if result else None
        record(name, got == expected, f"date={date_value}, time={time_range} -> {got} (expected {expected})")

    fast_dates = [
        ("Fast ordinal day-month", "book padel 11th May at 7pm", "11th may"),
        ("Fast month-day", "book padel May 11 at 7pm", "may 11"),
        ("Fast relative weeks", "book padel 4 weeks from now at 7pm", "4 weeks from now"),
    ]
    for name, msg, expected in fast_dates:
        got = _extract_fast_date_text(msg)
        record(name, got == expected, f"'{msg}' -> {got} (expected {expected})")


async def part2_live_tests():
    print("\n" + "=" * 60)
    print("PART 2: LIVE AGENT TESTS (blocked messages via full pipeline)")
    print("=" * 60 + "\n")

    agent = BookingAgent()

    async def run(msg, history=None):
        session_store.clear_session(phone)
        resp = await agent.process(phone, msg, history or [])
        return resp or ""

    print("--- 2A: Vulgar messages blocked by agent ---\n")
    vulgar_live = [
        ("Live: profanity", "fuck off"),
        ("Live: insult", "you stupid piece of shit"),
        ("Live: mild", "this is bullshit service"),
    ]
    for name, msg in vulgar_live:
        r = await run(msg)
        passed = VULGAR_MSG.lower() in r.lower()
        record(name, passed, f"'{msg}' -> {r[:100]}")

    print("\n--- 2B: Off-topic messages blocked by agent ---\n")
    offtopic_live = [
        ("Live: weather", "whats the weather like"),
        ("Live: joke", "tell me a joke"),
        ("Live: gibberish", "asdfghjkl zxcvbnm"),
        ("Live: movie", "recommend a good movie"),
    ]
    for name, msg in offtopic_live:
        r = await run(msg)
        passed = has_blocking_redirect(r)
        record(name, passed, f"'{msg}' -> {r[:100]}")

    print("\n--- 2C: Legit messages NOT blocked by agent ---\n")
    legit_live = [
        ("Live: greeting", "Hi"),
        ("Live: booking query", "padel tomorrow evening"),
    ]
    for name, msg in legit_live:
        r = await run(msg)
        passed = "i can help with sports bookings here" not in r.lower() and VULGAR_MSG.lower() not in r.lower()
        record(name, passed, f"'{msg}' -> {r[:100]}")

    print("\n--- 2D: Mid-conversation guardrail ---\n")
    session_store.clear_session(phone)
    r1 = await agent.process(phone, "padel tomorrow evening", [])
    print(f"  Setup: padel tomorrow evening -> {r1[:80]}...")
    history = [
        {"role": "user", "content": "padel tomorrow evening"},
        {"role": "assistant", "content": r1}
    ]

    r2 = await agent.process(phone, "tell me a joke instead", history)
    passed = has_blocking_redirect(r2)
    record("Live: off-topic mid-flow", passed, f"'tell me a joke instead' -> {r2[:100]}")

    r3 = await agent.process(phone, "that's too late", history)
    passed = (
        "earlier" in r3.lower()
        or "better" in r3.lower()
        or "another number" in r3.lower()
        or "different time" in r3.lower()
    )
    record("Live: unclear booking mid-flow", passed, f"'that's too late' -> {r3[:100]}")

    r4 = await agent.process(phone, "no slots?", history)
    passed = (
        ("available" in r4.lower() or "shown" in r4.lower() or "listed" in r4.lower() or "slots" in r4.lower() or "options" in r4.lower())
        and ("number" in r4.lower() or "different time" in r4.lower() or "date" in r4.lower())
    )
    record("Live: no-slots question mid-flow", passed, f"'no slots?' -> {r4[:100]}")

    history2 = history + [
        {"role": "user", "content": "1"},
        {"role": "assistant", "content": await agent.process(phone, "1", history)}
    ]
    r5 = await agent.process(phone, "maybe", history2)
    passed = "yes" in r5.lower() and "no" in r5.lower()
    record("Live: maybe at confirmation", passed, f"'maybe' -> {r5[:100]}")

    print("\n--- 2E: Policy errors do not poison active slot list ---\n")
    poison_phone = phone + "99"
    session_store.clear_session(poison_phone)
    p1 = await agent.process(poison_phone, "padel tomorrow evening", [])
    poison_history = [
        {"role": "user", "content": "padel tomorrow evening"},
        {"role": "assistant", "content": p1},
    ]
    p2 = await agent.process(poison_phone, "yes, 512 days from now", poison_history)
    p3 = await agent.process(poison_phone, "1", poison_history + [
        {"role": "user", "content": "yes, 512 days from now"},
        {"role": "assistant", "content": p2},
    ])
    passed = "next 14 days" in p2.lower() and "next 14 days" not in p3.lower() and ("confirm" in p3.lower() or "hold" in p3.lower() or "yes" in p3.lower())
    record("Live: invalid date does not persist over slot selection", passed, f"invalid -> {p2[:80]} | then '1' -> {p3[:120]}")


async def main():
    part1_unit_tests()
    await part2_live_tests()

    print("\n" + "=" * 60)
    print("GUARDRAILS TEST SUMMARY")
    print("=" * 60)
    passed = sum(1 for x in results if x["pass"])
    total = len(results)
    print(f"\nPassed: {passed}/{total}\n")

    failed = [r for r in results if not r["pass"]]
    if failed:
        print(f"FAILURES ({len(failed)}):")
        for f in failed:
            print(f"  - {f['name']}")
    else:
        print("All tests passed!")
    print()
    return len(failed) == 0


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)
