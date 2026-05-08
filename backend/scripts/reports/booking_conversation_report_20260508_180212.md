# Booking Conversation Test Report

Generated: 2026-05-08T18:02:12
Passed: 22/22

## Summary

- [PASS] direct_ace_4pm_today: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '16:00', 'end': '17:00'}, 'selected_area': None, 'slot_options_count': 1, 'pending_booking': True, 'pending_slot_id': '20260508_16_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '16:00', 'pending_end_time': '17:00', 'pending_price': 2000}
- [PASS] direct_ace_3pm_today: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '15:00', 'end': '16:00'}, 'selected_area': None, 'slot_options_count': 1, 'pending_booking': True, 'pending_slot_id': '20260508_15_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '15:00', 'pending_end_time': '16:00', 'pending_price': 2000}
- [PASS] direct_smash_evening: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 2, 'pending_booking': True, 'pending_slot_id': '20260508_17_smash_padel_clifton_smash_court_1', 'pending_vendor_id': 'smash_padel_clifton', 'pending_vendor_name': 'Smash Padel', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 1500}
- [PASS] roman_urdu_aaj_padel_available: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] multi_turn_basic_range: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] multi_turn_any_works_then_select: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '06:00', 'end': '24:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_07_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '07:00', 'pending_end_time': '08:00', 'pending_price': 2000}
- [PASS] multi_turn_whatever_available: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '06:00', 'end': '24:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_07_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '07:00', 'pending_end_time': '08:00', 'pending_price': 2000}
- [PASS] range_then_time_selection_6_7: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] range_then_any_works_auto_pick: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] after_7pm_then_first: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '19:00', 'end': '20:00'}, 'selected_area': None, 'slot_options_count': 3, 'pending_booking': True, 'pending_slot_id': '20260508_19_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '19:00', 'pending_end_time': '20:00', 'pending_price': 2000}
- [PASS] shaam_mei_koi_bhi: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260508_17_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}
- [PASS] selection_pehla_wala: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] selection_6pm_wala: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] selection_last: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260508_18_smash_padel_clifton_smash_court_1', 'pending_vendor_id': 'smash_padel_clifton', 'pending_vendor_name': 'Smash Padel', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 1500}
- [PASS] invalid_slot_number_keeps_list: invalid selection handled: {'awaiting_slot_selection': True, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
- [PASS] midflow_cheapest_then_select: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] midflow_rate_kya_hai_then_select: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
- [PASS] defence_padel_shaam: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'DHA', 'slot_options_count': 4, 'pending_booking': True, 'pending_slot_id': '20260508_17_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'DHA', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}
- [PASS] generic_defence_shaam_asks_sport: asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': None, 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': 'DHA', 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
- [PASS] generic_aaj_shaam_asks_sport: asked sport: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': None, 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
- [PASS] padel_only_asks_date_or_time: asked next missing detail: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': None, 'selected_time_range': None, 'selected_area': None, 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
- [PASS] typo_padl_tomorow_evning: reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-09', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260509_17_ace_padel_dha_ace_court_2', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}

## Transcripts

### [PASS] direct_ace_4pm_today
Notes: Direct English request with vendor, sport, time, date.
Tags: direct, vendor

Turn 1

User: Hi is there a slot at ace padel at 4pm today

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 16:00 - 17:00 — Rs 2000

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
    "start": "16:00",
    "end": "17:00"
  },
  "selected_area": null,
  "slot_options_count": 1,
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
16:00-17:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "start": "16:00",
    "end": "17:00"
  },
  "selected_area": null,
  "slot_options_count": 1,
  "pending_booking": true,
  "pending_slot_id": "20260508_16_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "16:00",
  "pending_end_time": "17:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '16:00', 'end': '17:00'}, 'selected_area': None, 'slot_options_count': 1, 'pending_booking': True, 'pending_slot_id': '20260508_16_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '16:00', 'pending_end_time': '17:00', 'pending_price': 2000}
```

### [PASS] direct_ace_3pm_today
Notes: Short direct vendor query.
Tags: direct, vendor

Turn 1

User: ace padel today 3pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 15:00 - 16:00 — Rs 2000

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
    "start": "15:00",
    "end": "16:00"
  },
  "selected_area": null,
  "slot_options_count": 1,
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
15:00-16:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "start": "15:00",
    "end": "16:00"
  },
  "selected_area": null,
  "slot_options_count": 1,
  "pending_booking": true,
  "pending_slot_id": "20260508_15_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "15:00",
  "pending_end_time": "16:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '15:00', 'end': '16:00'}, 'selected_area': None, 'slot_options_count': 1, 'pending_booking': True, 'pending_slot_id': '20260508_15_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '15:00', 'pending_end_time': '16:00', 'pending_price': 2000}
```

### [PASS] direct_smash_evening
Notes: Vendor-specific evening request.
Tags: direct, vendor

Turn 1

User: smash padel today evening

Bot:
```text
Available for 2026-05-08 in Karachi:


Smash Padel (Block 4, Clifton, Karachi)
   1. 17:00 - 18:00 — Rs 1500
   2. 18:00 - 19:00 — Rs 1500

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
  "selected_area": null,
  "slot_options_count": 2,
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
17:00-18:00 at Smash Padel, Rs 1500. Confirm? (reply yes to hold for 10 min, no to cancel)
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
  "selected_area": null,
  "slot_options_count": 2,
  "pending_booking": true,
  "pending_slot_id": "20260508_17_smash_padel_clifton_smash_court_1",
  "pending_vendor_id": "smash_padel_clifton",
  "pending_vendor_name": "Smash Padel",
  "pending_area": "Karachi",
  "pending_time": "17:00",
  "pending_end_time": "18:00",
  "pending_price": 1500
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 2, 'pending_booking': True, 'pending_slot_id': '20260508_17_smash_padel_clifton_smash_court_1', 'pending_vendor_id': 'smash_padel_clifton', 'pending_vendor_name': 'Smash Padel', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 1500}
```

### [PASS] roman_urdu_aaj_padel_available
Notes: Roman Urdu with typo 'hei'; should ask time, then show slots.
Tags: roman-urdu, multi-turn

Turn 1

User: Salam bhai aaj padel mei kya available hei

Bot:
```text
Time bataiye?
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

User: between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] multi_turn_basic_range
Notes: Classic guided flow to confirmation.
Tags: multi-turn, range

Turn 1

User: salam

Bot:
```text
Salam! Padel, futsal, cricket — kis ki booking hai?
```

Session summary:
```json
{
  "awaiting_slot_selection": false,
  "awaiting_confirmation": false,
  "awaiting_payment": false,
  "selected_sport_type": null,
  "selected_date": null,
  "selected_time_range": null,
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

Turn 2

User: padel

Bot:
```text
Got it — what day works?
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

User: today

Bot:
```text
What time were you thinking?
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

User: between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

Turn 5

User: 1

Bot:
```text
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] multi_turn_any_works_then_select
Notes: 'Any works' before a slot list means any time, then user selects.
Tags: multi-turn, flexible

Turn 1

User: padel chahiye

Bot:
```text
Sure, padel kab khelna hai?
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
Got it. What time works?
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

User: any works

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 07:00 - 08:00 — Rs 2000
   2. 08:00 - 09:00 — Rs 2000
   3. 09:00 - 10:00 — Rs 2000
   4. 10:00 - 11:00 — Rs 2000
   5. 11:00 - 12:00 — Rs 2000
   6. 12:00 - 13:00 — Rs 2000
   7. 13:00 - 14:00 — Rs 2000
   8. 14:00 - 15:00 — Rs 2000
   9. 15:00 - 16:00 — Rs 2000
   10. 16:00 - 17:00 — Rs 2000
   11. 17:00 - 18:00 — Rs 2000
   12. 18:00 - 19:00 — Rs 2000

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
    "start": "06:00",
    "end": "24:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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
07:00-08:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "start": "06:00",
    "end": "24:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_07_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "07:00",
  "pending_end_time": "08:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '06:00', 'end': '24:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_07_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '07:00', 'pending_end_time': '08:00', 'pending_price': 2000}
```

### [PASS] multi_turn_whatever_available
Notes: Flexible time wording should not trigger guardrails.
Tags: flexible

Turn 1

User: padel today

Bot:
```text
Any preferred time?
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

User: whatever is available

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 07:00 - 08:00 — Rs 2000
   2. 08:00 - 09:00 — Rs 2000
   3. 09:00 - 10:00 — Rs 2000
   4. 10:00 - 11:00 — Rs 2000
   5. 11:00 - 12:00 — Rs 2000
   6. 12:00 - 13:00 — Rs 2000
   7. 13:00 - 14:00 — Rs 2000
   8. 14:00 - 15:00 — Rs 2000
   9. 15:00 - 16:00 — Rs 2000
   10. 16:00 - 17:00 — Rs 2000
   11. 17:00 - 18:00 — Rs 2000
   12. 18:00 - 19:00 — Rs 2000

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
    "start": "06:00",
    "end": "24:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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
07:00-08:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "start": "06:00",
    "end": "24:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_07_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "07:00",
  "pending_end_time": "08:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '06:00', 'end': '24:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_07_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '07:00', 'pending_end_time': '08:00', 'pending_price': 2000}
```

### [PASS] range_then_time_selection_6_7
Notes: User selects a displayed slot by time range.
Tags: selection, range

Turn 1

User: padel today anytime between 6 and 11

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: 6-7

Bot:
```text
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "19:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] range_then_any_works_auto_pick
Notes: 'Any works' after slot list should create a real pending booking.
Tags: selection, flexible

Turn 1

User: padel today between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: any works

Bot:
```text
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] after_7pm_then_first
Notes: Open-ended time range.
Tags: flexible, open-ended

Turn 1

User: padel today

Bot:
```text
Any preferred time?
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

User: after 7pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 19:00 - 20:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   2. 19:00 - 20:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   3. 19:00 - 20:00 — Rs 1500

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
    "start": "19:00",
    "end": "20:00"
  },
  "selected_area": null,
  "slot_options_count": 3,
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
19:00-20:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "start": "19:00",
    "end": "20:00"
  },
  "selected_area": null,
  "slot_options_count": 3,
  "pending_booking": true,
  "pending_slot_id": "20260508_19_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "19:00",
  "pending_end_time": "20:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '19:00', 'end': '20:00'}, 'selected_area': None, 'slot_options_count': 3, 'pending_booking': True, 'pending_slot_id': '20260508_19_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '19:00', 'pending_end_time': '20:00', 'pending_price': 2000}
```

### [PASS] shaam_mei_koi_bhi
Notes: Roman Urdu flexible evening phrase.
Tags: roman-urdu, flexible

Turn 1

User: padel today

Bot:
```text
Any preferred time?
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

User: shaam mei koi bhi

Bot:
```text
Available for 2026-05-08 in Karachi:


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
  "selected_date": "2026-05-08",
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
  "selected_area": null,
  "slot_options_count": 6,
  "pending_booking": true,
  "pending_slot_id": "20260508_17_ace_padel_dha_ace_court_1",
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
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260508_17_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '17:00', 'pending_end_time': '18:00', 'pending_price': 2000}
```

### [PASS] selection_pehla_wala
Notes: Roman Urdu ordinal selection.
Tags: selection, roman-urdu

Turn 1

User: padel today between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: pehla wala

Bot:
```text
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] selection_6pm_wala
Notes: Time-based selection with Roman Urdu suffix.
Tags: selection, roman-urdu

Turn 1

User: padel today between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: 6pm wala

Bot:
```text
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "19:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] selection_last
Notes: Select last displayed option.
Tags: selection

Turn 1

User: padel today evening

Bot:
```text
Available for 2026-05-08 in Karachi:


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
  "selected_date": "2026-05-08",
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

User: last

Bot:
```text
18:00-19:00 at Smash Padel, Rs 1500. Confirm? (reply yes to hold for 10 min, no to cancel)
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
  "selected_area": null,
  "slot_options_count": 6,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_smash_padel_clifton_smash_court_1",
  "pending_vendor_id": "smash_padel_clifton",
  "pending_vendor_name": "Smash Padel",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 1500
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '17:00', 'end': '19:00'}, 'selected_area': None, 'slot_options_count': 6, 'pending_booking': True, 'pending_slot_id': '20260508_18_smash_padel_clifton_smash_court_1', 'pending_vendor_id': 'smash_padel_clifton', 'pending_vendor_name': 'Smash Padel', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 1500}
```

### [PASS] invalid_slot_number_keeps_list
Notes: Invalid selection should not reset or create pending booking.
Tags: selection, negative

Turn 1

User: padel today between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: 99

Bot:
```text
99 isn't on the list — please pick between 1 and 12.
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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
invalid selection handled: {'awaiting_slot_selection': True, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
```

### [PASS] midflow_cheapest_then_select
Notes: Cheapest question should preserve slot options.
Tags: mid-flow, pricing

Turn 1

User: padel today between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: cheapest?

Bot:
```text
Cheapest is Rs 1500 at Smash Padel (18:00-19:00). Which one would you like? (1-12)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] midflow_rate_kya_hai_then_select
Notes: Roman Urdu price question should preserve slot options.
Tags: mid-flow, pricing, roman-urdu

Turn 1

User: padel today between 6 and 11pm

Bot:
```text
Available for 2026-05-08 in Karachi:


Ace Padel Club (Street 12, Phase 6, DHA, Karachi)
   1. 18:00 - 19:00 — Rs 2000
   2. 19:00 - 20:00 — Rs 2000
   3. 20:00 - 21:00 — Rs 2000
   4. 21:00 - 22:00 — Rs 2000
   5. 22:00 - 23:00 — Rs 2000


Golden Court (Commercial Area, Phase 5, DHA, Karachi)
   6. 18:00 - 19:00 — Rs 1800
   7. 19:00 - 20:00 — Rs 1800
   8. 20:00 - 21:00 — Rs 1800
   9. 21:00 - 22:00 — Rs 1800
   10. 22:00 - 23:00 — Rs 1800


Smash Padel (Block 4, Clifton, Karachi)
   11. 18:00 - 19:00 — Rs 1500
   12. 19:00 - 20:00 — Rs 1500

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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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

User: rate kya hai

Bot:
```text
Sab se sasta Rs 1500 hai at Smash Padel (18:00-19:00). Kaunsa lena hai? (1-12)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
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
18:00-19:00 at Ace Padel Club, Rs 2000. Confirm? (reply yes to hold for 10 min, no to cancel)
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
    "end": "23:00"
  },
  "selected_area": null,
  "slot_options_count": 12,
  "pending_booking": true,
  "pending_slot_id": "20260508_18_ace_padel_dha_ace_court_1",
  "pending_vendor_id": "ace_padel_dha",
  "pending_vendor_name": "Ace Padel Club",
  "pending_area": "Karachi",
  "pending_time": "18:00",
  "pending_end_time": "19:00",
  "pending_price": 2000
}
```

Final detail:
```text
reached confirmation: {'awaiting_slot_selection': False, 'awaiting_confirmation': True, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': '2026-05-08', 'selected_time_range': {'start': '18:00', 'end': '23:00'}, 'selected_area': None, 'slot_options_count': 12, 'pending_booking': True, 'pending_slot_id': '20260508_18_ace_padel_dha_ace_court_1', 'pending_vendor_id': 'ace_padel_dha', 'pending_vendor_name': 'Ace Padel Club', 'pending_area': 'Karachi', 'pending_time': '18:00', 'pending_end_time': '19:00', 'pending_price': 2000}
```

### [PASS] defence_padel_shaam
Notes: 'defence' should map to DHA and preserve area/time.
Tags: area, roman-urdu

Turn 1

User: defence mei padel slot hei shaam ka

Bot:
```text
Got it — kaunsa din?
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
Sure — kis sport ka slot dekhun?
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

### [PASS] padel_only_asks_date_or_time
Notes: Sport-only turn should ask the next missing detail.
Tags: missing-info

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
asked next missing detail: {'awaiting_slot_selection': False, 'awaiting_confirmation': False, 'awaiting_payment': False, 'selected_sport_type': 'padel', 'selected_date': None, 'selected_time_range': None, 'selected_area': None, 'slot_options_count': 0, 'pending_booking': False, 'pending_slot_id': '', 'pending_vendor_id': None, 'pending_vendor_name': None, 'pending_area': None, 'pending_time': None, 'pending_end_time': None, 'pending_price': None}
```

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
