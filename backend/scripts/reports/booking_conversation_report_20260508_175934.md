# Booking Conversation Test Report

Generated: 2026-05-08T17:59:34
Passed: 1/1

## Summary

- [PASS] typo_padl_tomorow_evning: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-09', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260509_17_ace_padel_dha_ace_court_2', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}

## Transcripts

### [PASS] typo_padl_tomorow_evning
Notes: Typos should be handled by NLU fallback if fast path cannot parse.
Tags: typo, known-risk

Turn 1

User: padl tomorow evning

Bot:
```text
Available for 2026-05-09 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 17:00 - 18:00 — Rs 2000
   2. 18:00 - 19:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   3. 17:00 - 18:00 — Rs 1800
   4. 18:00 - 19:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   5. 17:00 - 18:00 — Rs 1500
   6. 18:00 - 19:00 — Rs 1500

Which one? Reply with the number.
```

Session summary:
```json
{
  "awaiting_slot_selection": true,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": "padel",
  "selected_date": "2026-05-09",
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": null,
  "slot_options_count": 6,
  "pending_booking": false,
  "pending_slot_id": "",
  "pending_vendor_id": null,
  "pending_vendor_name": null,
  "pending_area": null,
  "pending_time": null,
  "pending_end_time": null,
  "pending_price": null
}
```

Turn 2

User: 1

Bot:
```text
17:00-18:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": true,
  "awaiting_payment": false,
  "selected_sport_type": "padel",
  "selected_date": "2026-05-09",
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": null,
  "slot_options_count": 6,
  "pending_booking": true,
  "pending_slot_id": "20260509_17_ace_padel_dha_ace_court_2",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "17:00",
  "pending_end_time": "18:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-09', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260509_17_ace_padel_dha_ace_court_2', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}
```
