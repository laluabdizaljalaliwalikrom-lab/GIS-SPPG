"""Standalone smoke tests for the unit+date-aware market price matcher (no DB)."""
import sys
from datetime import date
from types import SimpleNamespace

sys.path.insert(0, ".")

from app import crud, unitmatch


class FakeQuery:
    def __init__(self, rows):
        self.rows = rows

    def order_by(self, *args, **kwargs):
        # prices provided sorted (price_date desc, created_at desc) by caller
        return self

    def all(self):
        return self.rows


class FakeDB:
    def __init__(self, prices):
        self.prices = prices

    def query(self, model):
        return FakeQuery(self.prices)


def mp(item_name, price, unit, price_date, created_at=""):
    return SimpleNamespace(
        item_name=item_name, reference_price=price, unit=unit,
        price_date=price_date, created_at=created_at, id=None,
    )


def test_convert_reference_price():
    # karung 25kg -> per kg
    assert unitmatch.convert_reference_price(250000, "karung", "kg") == (10000.0, "kg")
    # pack 12 pcs -> per pcs
    assert unitmatch.convert_reference_price(12000, "pack", "pcs") == (1000.0, "pcs")
    # same base liter -> ml
    assert unitmatch.convert_reference_price(19000, "galon", "liter") == (1000.0, "liter")
    # no cross-group path for kg <-> liter
    assert unitmatch.convert_reference_price(10000, "kg", "liter")[0] is None
    # back-conversion kg -> karung (25kg per karung)
    assert unitmatch.convert_reference_price(10000, "kg", "karung") == (250000.0, "kg")


def test_same_unit_equivalence():
    assert unitmatch.same_unit("Kilogram", "kg")
    assert unitmatch.same_unit("pcs", "pc")
    assert unitmatch.units_equivalent("kg", "gram")
    assert unitmatch.units_equivalent("karung", "kg")
    assert not unitmatch.units_equivalent("liter", "kg")


def test_date_aware_exact_match():
    prices = [
        mp("Beras", 11000, "kg", date(2026, 9, 1)),
        mp("Beras", 10000, "kg", date(2026, 8, 20)),
    ]
    db = FakeDB(prices)
    res = crud.find_market_price(db, "Beras", unit="kg", as_of_date=date(2026, 8, 30))
    assert res["market_price"] == 10000.0
    assert res["reference_date"] == date(2026, 8, 20)
    assert res["unit_converted"] is False
    assert res["reason"] is None

    res = crud.find_market_price(db, "Beras", unit="kg", as_of_date=date(2026, 9, 5))
    assert res["market_price"] == 11000.0

    # no survey before the nota date -> fall back to earliest available
    res = crud.find_market_price(db, "Beras", unit="kg", as_of_date=date(2026, 7, 1))
    assert res["market_price"] == 10000.0
    assert res["reference_date"] == date(2026, 8, 20)


def test_unit_conversion_match():
    # only a kg reference exists; the RAB line is in karung (25 kg/karung)
    prices = [mp("Beras", 16500, "kg", date(2026, 8, 25))]
    db = FakeDB(prices)
    res = crud.find_market_price(db, "Beras", unit="karung", as_of_date=date(2026, 8, 25))
    assert res["unit_converted"] is True
    assert res["reference_unit"] == "kg"
    assert res["market_price"] == 412500.0  # 16500 * 25


def test_unit_different_no_conversion():
    prices = [mp("Minyak", 20000, "kg", date(2026, 8, 25))]
    db = FakeDB(prices)
    res = crud.find_market_price(db, "Minyak", unit="liter", as_of_date=date(2026, 8, 25))
    assert res["reason"] == "unit_different_no_conversion"
    assert res["market_price"] == 0.0


def test_no_reference():
    db = FakeDB([mp("Beras", 16500, "kg", date(2026, 8, 25))])
    res = crud.find_market_price(db, "Gula Pasir", unit="kg", as_of_date=date(2026, 8, 25))
    assert res is None


def test_fuzzy_variants():
    prices = [mp("Daging Ayam", 34000, "kg", date(2026, 8, 25))]
    db = FakeDB(prices)
    res = crud.find_market_price(db, "Ayam", unit="kg", as_of_date=date(2026, 8, 25))
    assert res is not None and res["market_price"] == 34000.0


if __name__ == "__main__":
    # stub get_system_setting so no DB/config is touched
    crud.get_system_setting = lambda db, key=None: SimpleNamespace(value=None)
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    for fn in fns:
        fn()
        print(f"PASS {fn.__name__}")
    print(f"\n{len(fns)} tests passed.")