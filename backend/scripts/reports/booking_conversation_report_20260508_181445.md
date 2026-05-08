# Booking Conversation Test Report

Generated: 2026-05-08T18:14:45
Passed: 1/1

## Summary

- [PASS] anytime_after_6pm_distributed: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '24:00'}, 'selected_area': None, 'slot_options_count': 18, 'slot_option_vendors': ['Ace Padel Club', 'Golden Court', 'Smash Padel'], 'slot_option_times': ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00'], 'pending_booking': True, 'pending_slot_id': '20260508_18_golden_court_dha_golden_court_a', 'pending_vendor_id': 'golden_court_dha', 'pending_vendor_name': 'Golden Court', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 1800}

## Transcripts

### [PASS] anytime_after_6pm_distributed
Notes: 'Anytime after 6pm' should mean 18:00 onward and show every relevant slot across courts, not a full-day Ace-only list.
Tags: flexible, open-ended, display

Turn 1

User: padel

Bot:
```text
Sure, what date for padel?
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": "padel",
  "selected_date": null,
  "selected_time_range": null,
  "selected_area": null,
  "slot_options_count": 0,
  "slot_option_vendors": [],
  "slot_option_times": [],
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
What time works for you?
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": "padel",
  "selected_date": "2026-05-08",
  "selected_time_range": null,
  "selected_area": null,
  "slot_options_count": 0,
  "slot_option_vendors": [],
  "slot_option_times": [],
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

User: anytime after 6pm

Bot:
```text
Available padel slots for 2026-05-08 in Karachi:


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 1800
   2. 19:00 - 20:00 — Rs 1800
   3. 20:00 - 21:00 — Rs 1800
   4. 21:00 - 22:00 — Rs 1800
   5. 22:00 - 23:00 — Rs 1800
   6. 23:00 - 00:00 — Rs 1800


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   7. 18:00 - 19:00 — Rs 2000
   8. 19:00 - 20:00 — Rs 2000
   9. 20:00 - 21:00 — Rs 2000
   10. 21:00 - 22:00 — Rs 2000
   11. 22:00 - 23:00 — Rs 2000
   12. 23:00 - 00:00 — Rs 2000


Smash Padel (Block 4, Clifton, Karachi)
   13. 18:00 - 19:00 — Rs 1500
   14. 19:00 - 20:00 — Rs 1500
   15. 20:00 - 21:00 — Rs 1500
   16. 21:00 - 22:00 — Rs 1500
   17. 22:00 - 23:00 — Rs 1500
   18. 23:00 - 00:00 — Rs 1500

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
    "start": "18:00",
    "end": "24:00"
  },
  "selected_area": null,
  "slot_options_count": 18,
  "slot_option_vendors": [
    "Ace Padel Club",
    "Golden Court",
    "Smash Padel"
  ],
  "slot_option_times": [
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
    "22:00-23:00",
    "23:00-00:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
    "22:00-23:00",
    "23:00-00:00"
  ],
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

Turn 4

User: 1

Bot:
```text
18:00-19:00 at Golden Court, Rs 1800. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "start": "18:00",
    "end": "24:00"
  },
  "selected_area": null,
  "slot_options_count": 18,
  "slot_option_vendors": [
    "Ace Padel Club",
    "Golden Court",
    "Smash Padel"
  ],
  "slot_option_times": [
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
    "22:00-23:00",
    "23:00-00:00",
    "18:00-19:00",
    "19:00-20:00",
    "20:00-21:00",
    "21:00-22:00",
    "22:00-23:00",
    "23:00-00:00"
  ],
  "pending_booking": true,
  "pending_slot_id": "20260508_18_golden_court_dha_golden_court_a",
  "pending_vendor_id": "golden_court_dha",
  "pending_vendor_name": "Golden Court",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 1800
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '24:00'}, 'selected_area': None, 'slot_options_count': 18, 'slot_option_vendors': ['Ace Padel Club', 'Golden Court', 'Smash Padel'], 'slot_option_times': ['18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00', '18:00-19:00', '19:00-20:00', '20:00-21:00', '21:00-22:00', '22:00-23:00', '23:00-00:00'], 'pending_booking': True, 'pending_slot_id': '20260508_18_golden_court_dha_golden_court_a', 'pending_vendor_id': 'golden_court_dha', 'pending_vendor_name': 'Golden Court', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 1800}
```
