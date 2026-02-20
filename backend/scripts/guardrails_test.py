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

from agent.nodes import check_guardrails
from agent.session_store import session_store
from agent.graph import BookingAgent

VULGAR_MSG = "Please keep the conversation respectful"
BLOCK_MSG = "I can only help with sports court availability and booking"

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
        ("Movie", "recommend a good movie"),
        ("Personal", "how old are you"),
        ("Code", "write me a python script"),
        ("Philosophy", "what is the meaning of life"),
        ("Song lyrics", "never gonna give you up"),
        ("Random sentence", "the quick brown fox jumps over"),
    ]
    for name, msg in offtopic:
        result = check_guardrails(msg)
        record(name, result == "off_topic", f"'{msg}' -> {result}")

    print("\n--- 1C: Should return None (pass through) ---\n")
    legit = [
        ("Greeting hi", "hi"),
        ("Sport query", "padel tomorrow evening"),
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
        passed = BLOCK_MSG.lower() in r.lower()
        record(name, passed, f"'{msg}' -> {r[:100]}")

    print("\n--- 2C: Legit messages NOT blocked by agent ---\n")
    legit_live = [
        ("Live: greeting", "Hi"),
        ("Live: booking query", "padel tomorrow evening"),
    ]
    for name, msg in legit_live:
        r = await run(msg)
        passed = BLOCK_MSG.lower() not in r.lower() and VULGAR_MSG.lower() not in r.lower()
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
    passed = BLOCK_MSG.lower() in r2.lower()
    record("Live: off-topic mid-flow", passed, f"'tell me a joke instead' -> {r2[:100]}")


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
