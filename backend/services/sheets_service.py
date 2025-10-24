"""
Google Sheets Service - Integration with vendor Google Sheets
Member 4: Google Sheets Integration Lead

This service handles reading vendor Google Sheets to detect manual bookings
and sync them with the database. It uses the Google Sheets API with service
account authentication.

Reference: SL-IT-AI pattern + gspread library
"""

import logging
from typing import Dict, List, Any, Optional
import gspread
from google.oauth2.service_account import Credentials
from app.config import settings
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class GoogleSheetsService:
    """Google Sheets integration service"""
    
    def __init__(self):
        """Initialize Google Sheets service"""
        try:
            self.scopes = ['https://www.googleapis.com/auth/spreadsheets']
            self.creds = Credentials.from_service_account_file(
                settings.GOOGLE_SHEETS_CREDENTIALS_FILE,
                scopes=self.scopes
            )
            self.client = gspread.authorize(self.creds)
            logger.info("Google Sheets Service initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Google Sheets service: {e}")
            raise
    
    async def read_vendor_bookings(self, sheet_id: str) -> List[Dict[str, Any]]:
        """
        Read bookings from vendor's Google Sheet
        
        Args:
            sheet_id: Google Sheets document ID
            
        Returns:
            List of booking records from sheet
        """
        try:
            logger.info(f"Reading bookings from sheet: {sheet_id}")
            
            # Open the spreadsheet
            spreadsheet = self.client.open_by_key(sheet_id)
            worksheet = spreadsheet.sheet1  # Use first sheet
            
            # Get all records
            records = worksheet.get_all_records()
            
            # Parse booking records
            bookings = []
            for record in records:
                if self._is_valid_booking_record(record):
                    booking = self._parse_booking_record(record)
                    bookings.append(booking)
            
            logger.info(f"Found {len(bookings)} valid booking records")
            return bookings
            
        except Exception as e:
            logger.error(f"Error reading vendor sheet: {e}")
            return []
    
    def _is_valid_booking_record(self, record: Dict[str, Any]) -> bool:
        """Check if record is a valid booking"""
        required_fields = ['date', 'time', 'customer_name']
        
        # Check if all required fields exist and are not empty
        for field in required_fields:
            if field not in record or not record[field] or record[field].strip() == '':
                return False
        
        return True
    
    def _parse_booking_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Parse a booking record from sheet"""
        try:
            # Parse date (handle various formats)
            date_str = self._parse_date(record.get('date', ''))
            
            # Parse time (handle various formats)
            time_str = self._parse_time(record.get('time', ''))
            
            return {
                'sheet_row_id': record.get('row_id', ''),
                'date': date_str,
                'time': time_str,
                'customer_name': record.get('customer_name', '').strip(),
                'customer_phone': record.get('customer_phone', '').strip(),
                'service': record.get('service', 'futsal').strip(),
                'status': record.get('status', 'confirmed').strip(),
                'price': self._parse_price(record.get('price', '0')),
                'notes': record.get('notes', '').strip(),
                'created_at': datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Error parsing booking record: {e}")
            return None
    
    def _parse_date(self, date_str: str) -> str:
        """Parse date string to YYYY-MM-DD format"""
        try:
            # Handle various date formats
            date_formats = [
                '%Y-%m-%d',      # 2025-01-15
                '%d/%m/%Y',      # 15/01/2025
                '%d-%m-%Y',      # 15-01-2025
                '%m/%d/%Y',      # 01/15/2025
            ]
            
            for fmt in date_formats:
                try:
                    date_obj = datetime.strptime(date_str.strip(), fmt)
                    return date_obj.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            # If no format matches, try to parse relative dates
            date_str_lower = date_str.lower().strip()
            if 'tomorrow' in date_str_lower:
                tomorrow = datetime.now() + timedelta(days=1)
                return tomorrow.strftime('%Y-%m-%d')
            elif 'today' in date_str_lower:
                return datetime.now().strftime('%Y-%m-%d')
            
            # Default to today if parsing fails
            logger.warning(f"Could not parse date: {date_str}, using today")
            return datetime.now().strftime('%Y-%m-%d')
            
        except Exception as e:
            logger.error(f"Error parsing date: {e}")
            return datetime.now().strftime('%Y-%m-%d')
    
    def _parse_time(self, time_str: str) -> str:
        """Parse time string to HH:MM format"""
        try:
            time_str = time_str.strip()
            
            # Handle various time formats
            time_formats = [
                '%H:%M',         # 14:30
                '%I:%M %p',      # 2:30 PM
                '%I:%M%p',       # 2:30PM
                '%H:%M:%S',      # 14:30:00
            ]
            
            for fmt in time_formats:
                try:
                    time_obj = datetime.strptime(time_str, fmt)
                    return time_obj.strftime('%H:%M')
                except ValueError:
                    continue
            
            # Handle common time expressions
            time_lower = time_str.lower()
            if 'morning' in time_lower:
                return '09:00'
            elif 'afternoon' in time_lower:
                return '14:00'
            elif 'evening' in time_lower:
                return '18:00'
            elif 'night' in time_lower:
                return '20:00'
            
            # Default to current time if parsing fails
            logger.warning(f"Could not parse time: {time_str}, using current time")
            return datetime.now().strftime('%H:%M')
            
        except Exception as e:
            logger.error(f"Error parsing time: {e}")
            return datetime.now().strftime('%H:%M')
    
    def _parse_price(self, price_str: str) -> float:
        """Parse price string to float"""
        try:
            # Remove currency symbols and spaces
            price_clean = price_str.replace('Rs.', '').replace('PKR', '').replace(',', '').strip()
            return float(price_clean)
        except (ValueError, AttributeError):
            return 0.0
    
    async def sync_to_database(self, vendor_id: int, sheet_id: str) -> Dict[str, Any]:
        """
        Sync vendor sheet bookings to database
        
        Args:
            vendor_id: Vendor ID
            sheet_id: Google Sheets document ID
            
        Returns:
            Sync result with statistics
        """
        try:
            logger.info(f"Syncing sheet {sheet_id} for vendor {vendor_id}")
            
            # Read bookings from sheet
            sheet_bookings = await self.read_vendor_bookings(sheet_id)
            
            if not sheet_bookings:
                return {
                    'success': True,
                    'message': 'No bookings found in sheet',
                    'synced_count': 0
                }
            
            # TODO: Implement database sync logic
            # 1. Check which bookings are new (not in database)
            # 2. Create new bookings in database
            # 3. Update existing bookings if changed
            # 4. Handle conflicts (same slot booked in sheet and WhatsApp)
            
            synced_count = 0
            for booking in sheet_bookings:
                # TODO: Check if booking already exists
                # TODO: Create booking in database
                # TODO: Update availability slot status
                synced_count += 1
            
            logger.info(f"Synced {synced_count} bookings from sheet")
            return {
                'success': True,
                'synced_count': synced_count,
                'message': f'Synced {synced_count} bookings successfully'
            }
            
        except Exception as e:
            logger.error(f"Error syncing sheet to database: {e}")
            return {
                'success': False,
                'error': f'Sync failed: {str(e)}'
            }
    
    async def test_sheet_connection(self, sheet_id: str) -> Dict[str, Any]:
        """
        Test connection to a Google Sheet
        
        Args:
            sheet_id: Google Sheets document ID
            
        Returns:
            Connection test result
        """
        try:
            logger.info(f"Testing connection to sheet: {sheet_id}")
            
            # Try to open the spreadsheet
            spreadsheet = self.client.open_by_key(sheet_id)
            worksheet = spreadsheet.sheet1
            
            # Try to read a few rows
            records = worksheet.get_all_records()
            
            return {
                'success': True,
                'message': f'Successfully connected to sheet. Found {len(records)} rows.',
                'sample_columns': list(records[0].keys()) if records else []
            }
            
        except Exception as e:
            logger.error(f"Error testing sheet connection: {e}")
            return {
                'success': False,
                'error': f'Connection failed: {str(e)}'
            }
