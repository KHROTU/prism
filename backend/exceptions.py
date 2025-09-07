class ExternalApiException(Exception):
    pass

class RateLimitException(ExternalApiException):
    pass

class ServiceUnavailableException(ExternalApiException):
    pass