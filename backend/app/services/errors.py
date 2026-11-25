"""Domain errors raised by services. The API layer turns them into HTTP responses."""


class NotFoundError(Exception):
    """The requested resource does not exist (HTTP 404)."""


class ConflictError(Exception):
    """The request conflicts with the current state, e.g. dates already booked (HTTP 409)."""


class RuleViolationError(Exception):
    """The request is well-formed but breaks a business rule, e.g. too many guests (HTTP 422)."""
