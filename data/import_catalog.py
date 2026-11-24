"""Import the demo catalog into the database.

Run from the backend folder (so backend/.env is found), with the venv active:

    cd backend
    python ../data/import_catalog.py              # clean + import
    python ../data/import_catalog.py --dry-run    # clean and report only, no database writes
    python ../data/import_catalog.py --file ../data/other.json

Safe to run many times: records are matched by `source_id` and updated, not duplicated.
"""

import argparse
import json
import sys
from pathlib import Path

# Make `import app...` work when this script is started from the backend folder.
BACKEND = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

from sqlalchemy import func, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.database import get_engine  # noqa: E402
from app.models import Accommodation, Amenity  # noqa: E402
from app.services.catalog_import import clean_catalog, import_catalog  # noqa: E402

DEFAULT_FILE = Path(__file__).resolve().parent / "catalog_seed.json"


def main() -> int:
    parser = argparse.ArgumentParser(description="Import the Book4You demo catalog.")
    parser.add_argument("--file", type=Path, default=DEFAULT_FILE, help="catalog JSON file")
    parser.add_argument("--dry-run", action="store_true", help="validate only, do not write")
    args = parser.parse_args()

    catalog = json.loads(args.file.read_text(encoding="utf-8"))
    amenities = catalog["amenities"]
    report = clean_catalog(catalog["accommodations"], {a["slug"] for a in amenities})

    total = len(catalog["accommodations"])
    print(f"Read {total} records from {args.file.name}: {len(report.clean)} valid, "
          f"{len(report.dropped)} dropped")
    for dropped in report.dropped:
        print(f"  dropped {dropped.source_id}: {dropped.reason}")

    if args.dry_run:
        print("Dry run: nothing written.")
        return 0

    with Session(get_engine()) as session:
        stats = import_catalog(session, amenities, report.clean)
        session.commit()
        print(f"Imported: {stats.created} created, {stats.updated} updated, "
              f"{stats.amenities} new amenities.")
        print(f"Database now has {session.scalar(select(func.count(Accommodation.id)))} "
              f"accommodations and {session.scalar(select(func.count(Amenity.id)))} amenities.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
