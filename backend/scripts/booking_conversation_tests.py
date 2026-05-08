"""
Automated multi-turn booking conversation tests.

This script simulates WhatsApp-style conversations with fresh fake phone
numbers, records the actual bot replies, and checks whether the flow reaches
the correct booking state. The main suite stops at the confirmation prompt:
no "yes" is sent, so slots are not locked and payment/OCR is not exercised.

Usage:
    python backend/scripts/booking_conversation_tests.py --list
    python backend/scripts/booking_conversation_tests.py
    python backend/scripts/booking_conversation_tests.py --only direct_ace
"""

from __future__ import annotations

import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional


script_dir = Path(__file__).resolve().parent
backend_dir = script_dir.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

os.environ.setdefault("LOG_LEVEL", "ERROR")
logging.basicConfig(level=logging.ERROR)

Expectation = Callable[["ConversationResult"], tuple[bool, str]]


@dataclass
class TestCase:
    name: str
    turns: List[str]
    expect: Expectation
    notes: str = ""
    tags: tuple[str, ...] = ()


@dataclass
class TurnRecord:
    user: str
    bot: str
    session_summary: Dict[str, Any]


@dataclass
class ConversationResult:
    case: TestCase
    phone: str
    turns: List[TurnRecord]
    final_session: Dict[str, Any]
    passed: bool
    detail: str
    error: Optional[str] = None

    @property
    def last_response(self) -> str:
        return self.turns[-1].bot if self.turns else ""


def _lower(text: str) -> str:
    return (text or "").lower()


def _pending(session: Dict[str, Any]) -> Dict[str, Any]:
    return session.get("pending_booking") or {}


def _pending_slot(session: Dict[str, Any]) -> Dict[str, Any]:
    return _pending(session).get("slot") or {}


def _slot_id(session: Dict[str, Any]) -> str:
    pending = _pending(session)
    slot = _pending_slot(session)
    return pending.get("slot_id") or slot.get("slot_id") or slot.get("id") or ""


def _summarize_session(session: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    session = session or {}
    pending = _pending(session)
    slot = _pending_slot(session)
    slot_options = session.get("slot_options") or []
    slot_option_vendors = sorted({
        str(opt.get("vendor_name") or opt.get("vendor_id") or "")
        for opt in slot_options
        if opt.get("vendor_name") or opt.get("vendor_id")
    })
    slot_option_times = [
        f"{opt.get('slot_time')}-{opt.get('end_time')}"
        for opt in slot_options[:12]
    ]
    return {
        "awaiting_slot_selection": bool(session.get("awaiting_slot_selection")),
        "awaiting_confirmation": bool(session.get("awaiting_confirmation")),
        "awaiting_payment": bool(session.get("awaiting_payment")),
        "selected_sport_type": session.get("selected_sport_type"),
        "selected_date": session.get("selected_date"),
        "selected_time_range": session.get("selected_time_range"),
        "selected_area": session.get("selected_area"),
        "slot_options_count": len(slot_options),
        "slot_option_vendors": slot_option_vendors,
        "slot_option_times": slot_option_times,
        "pending_booking": bool(pending),
        "pending_slot_id": _slot_id(session),
        "pending_vendor_id": pending.get("vendor_id"),
        "pending_vendor_name": pending.get("vendor_name"),
        "pending_area": pending.get("area"),
        "pending_time": slot.get("slot_time"),
        "pending_end_time": slot.get("end_time"),
        "pending_price": pending.get("price") or slot.get("price"),
    }


def expect_confirmation(
    vendor_contains: Optional[str] = None,
    time_start: Optional[str] = None,
    area_contains: Optional[str] = None,
    min_price: Optional[int] = None,
    min_option_vendors: Optional[int] = None,
    min_slot_options: Optional[int] = None,
) -> Expectation:
    def _check(result: ConversationResult) -> tuple[bool, str]:
        session = result.final_session
        summary = _summarize_session(session)
        pending = _pending(session)
        slot = _pending_slot(session)
        response = _lower(result.last_response)

        if not session.get("awaiting_confirmation"):
            return False, f"expected awaiting_confirmation=True, got {summary}"
        if not pending:
            return False, f"expected pending_booking, got {summary}"
        if not _slot_id(session):
            return False, f"expected pending slot_id, got {summary}"
        if not pending.get("vendor_id"):
            return False, f"expected pending vendor_id, got {summary}"
        if not any(word in response for word in ("confirm", "yes", "no", "hold", "reserve")):
            return False, "expected final response to ask for confirmation"

        if vendor_contains:
            haystack = f"{pending.get('vendor_name', '')} {pending.get('vendor_id', '')}".lower()
            if vendor_contains.lower() not in haystack:
                return False, f"expected vendor containing {vendor_contains!r}, got {summary}"

        if time_start and slot.get("slot_time") != time_start:
            return False, f"expected slot_time={time_start}, got {summary}"

        if area_contains:
            haystack = f"{pending.get('area', '')} {session.get('selected_area', '')}".lower()
            if area_contains.lower() not in haystack:
                return False, f"expected area containing {area_contains!r}, got {summary}"

        if min_price is not None:
            price = pending.get("price") or slot.get("price") or 0
            if int(price) < min_price:
                return False, f"expected price >= {min_price}, got {summary}"

        if min_option_vendors is not None:
            vendors = summary.get("slot_option_vendors") or []
            if len(vendors) < min_option_vendors:
                return False, f"expected at least {min_option_vendors} displayed vendors, got {summary}"

        if min_slot_options is not None:
            if int(summary.get("slot_options_count") or 0) < min_slot_options:
                return False, f"expected at least {min_slot_options} displayed slots, got {summary}"

        return True, f"reached confirmation: {summary}"

    return _check


def expect_asks_sport(result: ConversationResult) -> tuple[bool, str]:
    response = _lower(result.last_response)
    session = result.final_session
    mentions_options = (
        ("padel" in response and "futsal" in response)
        or "which sport" in response
        or "kis sport" in response
        or "kis ki booking" in response
        or "kya book" in response
    )
    if not mentions_options:
        return False, f"expected bot to ask sport, got response={result.last_response!r}, state={_summarize_session(session)}"
    if session.get("awaiting_slot_selection") or session.get("pending_booking"):
        return False, f"should not show/select slots before sport is known: {_summarize_session(session)}"
    return True, f"asked sport: {_summarize_session(session)}"


def expect_asks_date_or_time(result: ConversationResult) -> tuple[bool, str]:
    response = _lower(result.last_response)
    session = result.final_session
    if any(word in response for word in ("date", "day", "din", "kab", "time", "when", "kaunsa time")):
        return True, f"asked next missing detail: {_summarize_session(session)}"
    return False, f"expected missing-detail prompt, got response={result.last_response!r}, state={_summarize_session(session)}"


def expect_invalid_selection(result: ConversationResult) -> tuple[bool, str]:
    session = result.final_session
    response = _lower(result.last_response)
    if not session.get("awaiting_slot_selection"):
        return False, f"expected slot list to remain active, got {_summarize_session(session)}"
    if session.get("pending_booking") or session.get("awaiting_confirmation"):
        return False, f"invalid number should not create pending booking, got {_summarize_session(session)}"
    if "pick" not in response and "between" not in response and "list" not in response:
        return False, f"expected invalid-number prompt, got {result.last_response!r}"
    return True, f"invalid selection handled: {_summarize_session(session)}"


def build_cases() -> List[TestCase]:
    return [
        TestCase(
            name="direct_ace_4pm_today",
            turns=["Hi is there a slot at ace padel at 4pm today", "1"],
            expect=expect_confirmation(vendor_contains="ace", time_start="16:00"),
            notes="Direct English request with vendor, sport, time, date.",
            tags=("direct", "vendor"),
        ),
        TestCase(
            name="direct_ace_3pm_today",
            turns=["ace padel today 3pm", "1"],
            expect=expect_confirmation(vendor_contains="ace", time_start="15:00"),
            notes="Short direct vendor query.",
            tags=("direct", "vendor"),
        ),
        TestCase(
            name="direct_smash_evening",
            turns=["smash padel today evening", "1"],
            expect=expect_confirmation(vendor_contains="smash"),
            notes="Vendor-specific evening request.",
            tags=("direct", "vendor"),
        ),
        TestCase(
            name="roman_urdu_aaj_padel_available",
            turns=["Salam bhai aaj padel mei kya available hei", "between 6 and 11pm", "1"],
            expect=expect_confirmation(),
            notes="Roman Urdu with typo 'hei'; should ask time, then show slots.",
            tags=("roman-urdu", "multi-turn"),
        ),
        TestCase(
            name="multi_turn_basic_range",
            turns=["salam", "padel", "today", "between 6 and 11pm", "1"],
            expect=expect_confirmation(time_start="18:00"),
            notes="Classic guided flow to confirmation.",
            tags=("multi-turn", "range"),
        ),
        TestCase(
            name="multi_turn_any_works_then_select",
            turns=["padel chahiye", "today", "any works", "1"],
            expect=expect_confirmation(),
            notes="'Any works' before a slot list means any time, then user selects.",
            tags=("multi-turn", "flexible"),
        ),
        TestCase(
            name="multi_turn_whatever_available",
            turns=["padel today", "whatever is available", "1"],
            expect=expect_confirmation(),
            notes="Flexible time wording should not trigger guardrails.",
            tags=("flexible",),
        ),
        TestCase(
            name="range_then_time_selection_6_7",
            turns=["padel today anytime between 6 and 11", "6-7"],
            expect=expect_confirmation(time_start="18:00"),
            notes="User selects a displayed slot by time range.",
            tags=("selection", "range"),
        ),
        TestCase(
            name="range_then_any_works_auto_pick",
            turns=["padel today between 6 and 11pm", "any works"],
            expect=expect_confirmation(time_start="18:00"),
            notes="'Any works' after slot list should create a real pending booking.",
            tags=("selection", "flexible"),
        ),
        TestCase(
            name="after_7pm_then_first",
            turns=["padel today", "after 7pm", "1"],
            expect=expect_confirmation(),
            notes="Open-ended time range.",
            tags=("flexible", "open-ended"),
        ),
        TestCase(
            name="anytime_after_6pm_distributed",
            turns=["padel", "today", "anytime after 6pm", "1"],
            expect=expect_confirmation(time_start="18:00", min_option_vendors=2, min_slot_options=13),
            notes="'Anytime after 6pm' should mean 18:00 onward and show every relevant slot across courts, not a full-day Ace-only list.",
            tags=("flexible", "open-ended", "display"),
        ),
        TestCase(
            name="shaam_mei_koi_bhi",
            turns=["padel today", "shaam mei koi bhi", "1"],
            expect=expect_confirmation(),
            notes="Roman Urdu flexible evening phrase.",
            tags=("roman-urdu", "flexible"),
        ),
        TestCase(
            name="selection_pehla_wala",
            turns=["padel today between 6 and 11pm", "pehla wala"],
            expect=expect_confirmation(time_start="18:00"),
            notes="Roman Urdu ordinal selection.",
            tags=("selection", "roman-urdu"),
        ),
        TestCase(
            name="selection_6pm_wala",
            turns=["padel today between 6 and 11pm", "6pm wala"],
            expect=expect_confirmation(time_start="18:00"),
            notes="Time-based selection with Roman Urdu suffix.",
            tags=("selection", "roman-urdu"),
        ),
        TestCase(
            name="selection_last",
            turns=["padel today evening", "last"],
            expect=expect_confirmation(),
            notes="Select last displayed option.",
            tags=("selection",),
        ),
        TestCase(
            name="invalid_slot_number_keeps_list",
            turns=["padel today between 6 and 11pm", "99"],
            expect=expect_invalid_selection,
            notes="Invalid selection should not reset or create pending booking.",
            tags=("selection", "negative"),
        ),
        TestCase(
            name="midflow_cheapest_then_select",
            turns=["padel today between 6 and 11pm", "cheapest?", "1"],
            expect=expect_confirmation(),
            notes="Cheapest question should preserve slot options.",
            tags=("mid-flow", "pricing"),
        ),
        TestCase(
            name="midflow_rate_kya_hai_then_select",
            turns=["padel today between 6 and 11pm", "rate kya hai", "1"],
            expect=expect_confirmation(),
            notes="Roman Urdu price question should preserve slot options.",
            tags=("mid-flow", "pricing", "roman-urdu"),
        ),
        TestCase(
            name="defence_padel_shaam",
            turns=["defence mei padel slot hei shaam ka", "today", "1"],
            expect=expect_confirmation(area_contains="dha"),
            notes="'defence' should map to DHA and preserve area/time.",
            tags=("area", "roman-urdu"),
        ),
        TestCase(
            name="generic_defence_shaam_asks_sport",
            turns=["defence mei koi slot hei shaam ka"],
            expect=expect_asks_sport,
            notes="Ambiguous area/time without sport should ask sport first.",
            tags=("missing-info", "area", "known-risk"),
        ),
        TestCase(
            name="generic_aaj_shaam_asks_sport",
            turns=["aaj shaam koi slot hai?"],
            expect=expect_asks_sport,
            notes="Generic date/time without sport should ask sport.",
            tags=("missing-info", "known-risk"),
        ),
        TestCase(
            name="padel_only_asks_date_or_time",
            turns=["padel"],
            expect=expect_asks_date_or_time,
            notes="Sport-only turn should ask the next missing detail.",
            tags=("missing-info",),
        ),
        TestCase(
            name="typo_padl_tomorow_evning",
            turns=["padl tomorow evning", "1"],
            expect=expect_confirmation(),
            notes="Typos should be handled by NLU fallback if fast path cannot parse.",
            tags=("typo", "known-risk"),
        ),
    ]


async def run_case(case: TestCase, agent: Any) -> ConversationResult:
    from agent.session_store import session_store

    phone = f"convtest_{uuid.uuid4().hex[:10]}"
    history: List[Dict[str, str]] = []
    records: List[TurnRecord] = []

    try:
        session_store.clear_session(phone)
        for user_msg in case.turns:
            bot = await agent.process(phone, user_msg, history)
            session = session_store.get_session(phone) or {}
            records.append(
                TurnRecord(
                    user=user_msg,
                    bot=bot,
                    session_summary=_summarize_session(session),
                )
            )
            history.append({"role": "user", "content": user_msg})
            history.append({"role": "assistant", "content": bot})

        final_session = session_store.get_session(phone) or {}
        partial = ConversationResult(
            case=case,
            phone=phone,
            turns=records,
            final_session=final_session,
            passed=False,
            detail="",
        )
        passed, detail = case.expect(partial)
        partial.passed = passed
        partial.detail = detail
        return partial
    except Exception as exc:
        return ConversationResult(
            case=case,
            phone=phone,
            turns=records,
            final_session=session_store.get_session(phone) or {},
            passed=False,
            detail=f"exception: {exc}",
            error=repr(exc),
        )
    finally:
        # These tests stop before locking, but clear in-memory state anyway so
        # repeated local runs never inherit old context.
        session_store.clear_session(phone)


def result_to_dict(result: ConversationResult) -> Dict[str, Any]:
    return {
        "name": result.case.name,
        "passed": result.passed,
        "detail": result.detail,
        "error": result.error,
        "notes": result.case.notes,
        "tags": list(result.case.tags),
        "phone": result.phone,
        "turns": [
            {
                "user": t.user,
                "bot": t.bot,
                "session": t.session_summary,
            }
            for t in result.turns
        ],
        "final_session": _summarize_session(result.final_session),
    }


def write_reports(results: List[ConversationResult], report_dir: Path) -> tuple[Path, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    md_path = report_dir / f"booking_conversation_report_{stamp}.md"
    json_path = report_dir / f"booking_conversation_report_{stamp}.json"

    passed = sum(1 for r in results if r.passed)
    total = len(results)

    lines = [
        "# Booking Conversation Test Report",
        "",
        f"Generated: {datetime.now().isoformat(timespec='seconds')}",
        f"Passed: {passed}/{total}",
        "",
        "## Summary",
        "",
    ]
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        lines.append(f"- [{status}] {result.case.name}: {result.detail}")

    lines.append("")
    lines.append("## Transcripts")
    lines.append("")

    for result in results:
        status = "PASS" if result.passed else "FAIL"
        lines.append(f"### [{status}] {result.case.name}")
        if result.case.notes:
            lines.append(f"Notes: {result.case.notes}")
        if result.case.tags:
            lines.append(f"Tags: {', '.join(result.case.tags)}")
        lines.append("")
        for i, turn in enumerate(result.turns, start=1):
            lines.append(f"Turn {i}")
            lines.append("")
            lines.append(f"User: {turn.user}")
            lines.append("")
            lines.append("Bot:")
            lines.append("```text")
            lines.append(turn.bot)
            lines.append("```")
            lines.append("")
            lines.append("Session summary:")
            lines.append("```json")
            lines.append(json.dumps(turn.session_summary, indent=2, default=str))
            lines.append("```")
            lines.append("")
        lines.append("Final detail:")
        lines.append("```text")
        lines.append(result.detail)
        lines.append("```")
        lines.append("")

    md_path.write_text("\n".join(lines), encoding="utf-8")
    json_path.write_text(
        json.dumps([result_to_dict(r) for r in results], indent=2, default=str),
        encoding="utf-8",
    )
    return md_path, json_path


def print_result(result: ConversationResult, verbose: bool = False) -> None:
    status = "PASS" if result.passed else "FAIL"
    print(f"[{status}] {result.case.name}")
    print(f"  {result.detail}")
    if verbose or not result.passed:
        for turn in result.turns:
            print(f"  U: {turn.user}")
            print(f"  B: {turn.bot.replace(chr(10), chr(10) + '     ')}")
            print(f"  S: {json.dumps(turn.session_summary, default=str)}")


async def main() -> int:
    parser = argparse.ArgumentParser(description="Run multi-turn booking conversation tests.")
    parser.add_argument("--list", action="store_true", help="List planned tests without running them.")
    parser.add_argument("--only", default="", help="Run tests whose name or tags contain this text.")
    parser.add_argument("--verbose", action="store_true", help="Print full passing transcripts too.")
    parser.add_argument("--stop-on-fail", action="store_true", help="Stop after first failing test.")
    parser.add_argument(
        "--report-dir",
        default=str(script_dir / "reports"),
        help="Directory for Markdown and JSON reports.",
    )
    args = parser.parse_args()

    cases = build_cases()
    if args.only:
        needle = args.only.lower()
        cases = [
            case
            for case in cases
            if needle in case.name.lower() or any(needle in tag.lower() for tag in case.tags)
        ]

    if args.list:
        print("Planned booking conversation tests:")
        for idx, case in enumerate(cases, start=1):
            tags = f" [{', '.join(case.tags)}]" if case.tags else ""
            print(f"{idx:02d}. {case.name}{tags}")
            for turn in case.turns:
                print(f"    U: {turn}")
            if case.notes:
                print(f"    Notes: {case.notes}")
        return 0

    if not cases:
        print("No tests matched.")
        return 1

    print(f"Running {len(cases)} booking conversation test(s)...")
    print("These tests stop at confirmation and do not send 'yes'.")
    print()

    from agent.graph import BookingAgent

    agent = BookingAgent()
    results: List[ConversationResult] = []
    for case in cases:
        result = await run_case(case, agent)
        results.append(result)
        print_result(result, verbose=args.verbose)
        print()
        if args.stop_on_fail and not result.passed:
            break

    md_path, json_path = write_reports(results, Path(args.report_dir))
    passed = sum(1 for r in results if r.passed)
    total = len(results)

    print("=" * 72)
    print(f"Passed: {passed}/{total}")
    print(f"Markdown report: {md_path}")
    print(f"JSON report: {json_path}")

    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
