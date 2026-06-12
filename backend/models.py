from pydantic import BaseModel


class BirthData(BaseModel):
    name: str
    year: int
    month: int
    day: int
    hour: int
    minute: int
    lng: float
    lat: float
    tz_str: str


class SynastryRequest(BaseModel):
    person1: BirthData
    person2: BirthData


class TransitRequest(BaseModel):
    person: BirthData
    observer_lng: float
    observer_lat: float
    observer_tz: str


class UpcomingTransitsRequest(BaseModel):
    person: BirthData
    observer_lng: float
    observer_lat: float
    observer_tz: str
    days: int = 30
