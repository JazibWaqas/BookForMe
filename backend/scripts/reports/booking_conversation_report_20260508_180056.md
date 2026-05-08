# Booking Conversation Test Report

Generated: 2026-05-08T18:00:56
Passed: 2/2

## Summary

- [PASS] generic_defence_shaam_asks_sport: asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': None, 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'DHA', 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
- [PASS] generic_aaj_shaam_asks_sport: asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}

## Transcripts

### [PASS] generic_defence_shaam_asks_sport
Notes: Ambiguous area/time without sport should ask sport first.
Tags: missing-info, area, known-risk

Turn 1

User: defence mei koi slot hei shaam ka

Bot:
```text
Padel, futsal, cricket, ya pickleball — kis ki booking chahiye?
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

Final detail:
```text
asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': None, 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'DHA', 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
```

### [PASS] generic_aaj_shaam_asks_sport
Notes: Generic date/time without sport should ask sport.
Tags: missing-info, known-risk

Turn 1

User: aaj shaam koi slot hai?

Bot:
```text
Kaunsi sport chahiye — padel, futsal, cricket, ya pickleball?
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": null,
  "selected_date": "2026-05-08",
  "selected_time_range": {
    "start": "17:00",
    "end": "19:00"
  },
  "selected_area": null,
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
asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
```
