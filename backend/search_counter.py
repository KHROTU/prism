import datetime

_search_count = 0
_last_reset_date = datetime.date.today()

def _reset_if_new_day():
    global _search_count, _last_reset_date
    today = datetime.date.today()
    if today != _last_reset_date:
        _search_count = 0
        _last_reset_date = today

def increment_search_count():
    global _search_count
    _reset_if_new_day()
    _search_count += 1

def get_search_count():
    _reset_if_new_day()
    return _search_count