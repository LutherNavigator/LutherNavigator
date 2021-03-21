import argparse
import csv
import os

import mysql.connector

import env
import db

from typing import List


def get_columns(cur, table: str) -> List[str]:
    """Get the columns from MySQL database."""

    cur.execute(f"SHOW COLUMNS FROM {table};")
    columns = [column[0] for column in cur]
    return columns


def save_table(outfile: str, table: str, fields: List[str] = None) -> None:
    """Saves the database table."""

    envars = env.get_env(".env")
    args = db.parse_db_url(envars["DATABASE_URL"])

    the_db = mysql.connector.connect(
        host=args["host"],
        user=args["user"],
        password=args["password"],
        database=args["name"],
    )
    cur = the_db.cursor()

    if not fields:
        field_str = "*"
    else:
        field_str = ", ".join(fields)

    columns = get_columns(cur, table)
    cur.execute(f"SELECT {field_str} FROM {table};")

    with open(outfile, "w", newline="") as csvfile:
        csv_writer = csv.writer(csvfile, dialect="excel")
        csv_writer.writerow(columns)
        csv_writer.writerows(cur)

    cur.close()
    the_db.close()


def main() -> None:
    """Process the command line arguments."""

    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="A CSV utility")

    # Specify output filename/path
    parser.add_argument(
        "-o",
        "--out",
        type=str,
        default="",
        help="output filaname/path",
    )

    # Specify table name
    parser.add_argument(
        "-t",
        "--table",
        type=str,
        default="",
        help="table name",
    )

    # Specify table fields
    parser.add_argument(
        "-f",
        "--fields",
        type=str,
        default="",
        help="table fields",
    )

    # Get the values of the arguments
    args = parser.parse_args()

    # If all arguments are specified, save the table
    if args.out and args.table and args.fields:
        # Append CSV extension
        out: str = args.out
        if os.path.splitext(out)[1] == "":
            out += ".csv"

        # Save the table
        save_table(out, args.table, args.fields)


if __name__ == "__main__":
    main()
