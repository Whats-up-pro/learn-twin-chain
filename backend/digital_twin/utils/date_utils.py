"""
Utility functions for date formatting in Vietnam timezone
"""
from datetime import datetime, timezone, timedelta
import pytz

# Vietnam timezone
VIETNAM_TZ = pytz.timezone('Asia/Ho_Chi_Minh')

def get_current_vietnam_time():
    """
    Get current date in Vietnam timezone (UTC+7)
    @returns: Date string in format "YYYY-MM-DD HH:mm:ss"
    """
    vietnam_time = datetime.now(VIETNAM_TZ)
    return vietnam_time.strftime("%Y-%m-%d %H:%M:%S")

def get_current_vietnam_time_iso():
    """
    Get current date in Vietnam timezone with full ISO format
    @returns: ISO string in Vietnam timezone
    """
    vietnam_time = datetime.now(VIETNAM_TZ)
    return vietnam_time.isoformat()

def format_to_vietnam_time(date_obj):
    """
    Format a date to Vietnam timezone
    @param date_obj: Date to format (datetime object or string)
    @returns: Formatted date string
    """
    if isinstance(date_obj, str):
        # Parse ISO string
        date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
    
    # Convert to Vietnam timezone
    if date_obj.tzinfo is None:
        # If no timezone info, assume UTC
        date_obj = date_obj.replace(tzinfo=timezone.utc)
    
    vietnam_time = date_obj.astimezone(VIETNAM_TZ)
    return vietnam_time.strftime("%Y-%m-%d %H:%M:%S")

def format_to_vietnam_time_iso(date_obj):
    """
    Format a date to Vietnam timezone with full ISO format
    @param date_obj: Date to format (datetime object or string)
    @returns: ISO string in Vietnam timezone
    """
    if isinstance(date_obj, str):
        # Parse ISO string
        date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
    
    # Convert to Vietnam timezone
    if date_obj.tzinfo is None:
        # If no timezone info, assume UTC
        date_obj = date_obj.replace(tzinfo=timezone.utc)
    
    vietnam_time = date_obj.astimezone(VIETNAM_TZ)
    return vietnam_time.isoformat()

def get_current_vietnam_time_display():
    """
    Get current date in Vietnam timezone for display
    @returns: Date string in format "DD/MM/YYYY HH:mm:ss"
    """
    vietnam_time = datetime.now(VIETNAM_TZ)
    return vietnam_time.strftime("%d/%m/%Y %H:%M:%S")

def format_to_vietnam_time_display(date_obj):
    """
    Format a date to Vietnam timezone for display
    @param date_obj: Date to format (datetime object or string)
    @returns: Date string in format "DD/MM/YYYY HH:mm:ss"
    """
    if isinstance(date_obj, str):
        # Parse ISO string
        date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
    
    # Convert to Vietnam timezone
    if date_obj.tzinfo is None:
        # If no timezone info, assume UTC
        date_obj = date_obj.replace(tzinfo=timezone.utc)
    
    vietnam_time = date_obj.astimezone(VIETNAM_TZ)
    return vietnam_time.strftime("%d/%m/%Y %H:%M:%S") 