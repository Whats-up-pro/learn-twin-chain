class EventProcessor:
    """
    Xử lý sự kiện cho Digital Twin.
    """
    def __init__(self):
        self.events = []

    def process_event(self, event: dict):
        """
        Xử lý một sự kiện và lưu lại.
        """
        self.events.append(event)
        # Thêm logic xử lý sự kiện tại đây

    def get_events(self):
        return self.events 