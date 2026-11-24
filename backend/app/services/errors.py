"""Domain errors raised by services. The API layer turns them into HTTP responses."""


class NotFoundError(Exception):
    """The requested resource does not exist."""
