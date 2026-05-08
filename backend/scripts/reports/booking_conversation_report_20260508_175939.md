# Booking Conversation Test Report

Generated: 2026-05-08T17:59:39
Passed: 2/2

## Summary

- [PASS] defence_padel_shaam: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'DHA', 'slot_options_count': 4, 'pending_booking': True, 'pending_slot_id': '20260508_17_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'DHA', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}
- [PASS] generic_defence_shaam_asks_sport: asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': None, 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'defence', 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}

## Transcripts

### [PASS] defence_padel_shaam
Notes: 'defence' should map to DHA and preserve area/time.
Tags: area, roman-urdu

Turn 1

User: defence mei padel slot hei shaam ka

Bot:
```text
padel ke liye kaunsi date?
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": "padel",
  "selected_date": null,
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": "DHA",
  "slot_options_count": 0,
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

User: today

Bot:
```text
Available for 2026-05-08 in DHA:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 17:00 - 18:00 — Rs 2000
   2. 18:00 - 19:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   3. 17:00 - 18:00 — Rs 1800
   4. 18:00 - 19:00 — Rs 1800

Which one? Reply with the number.
```

Session summary:
```json
{
  "awaiting_slot_selection": true,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": "padel",
  "selected_date": "2026-05-08",
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": "DHA",
  "slot_options_count": 4,
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

Turn 3

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
  "selected_date": "2026-05-08",
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": "DHA",
  "slot_options_count": 4,
  "pending_booking": true,
  "pending_slot_id": "20260508_17_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "DHA",
  "pending_time": "17:00",
  "pending_end_time": "18:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'DHA', 'slot_options_count': 4, 'pending_booking': True, 'pending_slot_id': '20260508_17_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'DHA', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}
```

### [PASS] generic_defence_shaam_asks_sport
Notes: Ambiguous area/time without sport should ask sport first.
Tags: missing-info, area, known-risk

Turn 1

User: defence mei koi slot hei shaam ka

Bot:
```text
Sure — kis sport ka slot dekhun?
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": null,
  "selected_date": null,
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": "defence",
  "slot_options_count": 0,
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

Final detail:
```text
asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': None, 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'defence', 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
```
