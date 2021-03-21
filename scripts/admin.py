import argparse

import mysql.connector

import env
import db

from typing import Any, List


# Fields required for the admin
ADMIN_FIELDS: List[str] = ["id", "firstname", "lastname", "email"]


def get_conn() -> Any:
    """Get the connected component."""

    envars = env.get_env(".env")
    args = db.parse_db_url(envars["DATABASE_URL"])

    # Connect to the database
    the_db = mysql.connector.connect(
        host=args["host"],
        user=args["user"],
        password=args["password"],
        database=args["name"],
    )

    return the_db


def add_admin(email: str) -> str:
    """Adds an admin to the list of admins."""

    conn = get_conn()
    cur = conn.cursor()

    err = ""

    cur.execute(f"SELECT id FROM User WHERE email = '{email}';")
    res = cur.fetchall()
    if len(res) == 0:
        err = "a user with the specified email does not exist"
    else:
        cur.execute(
            f"SELECT id FROM User WHERE email = '{email}' AND admin = FALSE;"
        )
        res = cur.fetchall()
        if len(res) == 0:
            err = "the user is already an admin"
        else:
            cur.execute(
                f"UPDATE User SET admin = TRUE WHERE email = '{email}';"
            )
            conn.commit()

    cur.close()
    conn.close()

    return err


def remove_admin(email: str) -> str:
    """Removes an admin from the list of admins."""

    conn = get_conn()
    cur = conn.cursor()

    err = ""

    cur.execute(f"SELECT id FROM User WHERE email = '{email}';")
    res = cur.fetchall()
    if len(res) == 0:
        err = "a user with the specified email does not exist"
    else:
        cur.execute(
            f"SELECT id FROM User WHERE email = '{email}' AND admin = TRUE;"
        )
        res = cur.fetchall()
        if len(res) == 0:
            err = "the user is not an admin"
        else:
            cur.execute(
                f"UPDATE User SET admin = FALSE WHERE email = '{email}';"
            )
            conn.commit()

    cur.close()
    conn.close()

    return err


def list_admins() -> List[str]:
    """Lists all admins."""

    conn = get_conn()
    cur = conn.cursor()

    cur.execute(
        f"SELECT {', '.join(ADMIN_FIELDS)} FROM User WHERE admin = TRUE;"
    )
    res = cur.fetchall()

    cur.close()
    conn.close()

    return res


def max_length(list: List[Any], index: int) -> int:
    """Computs the maximum length."""

    maxlen = 0

    for item in list:
        if len(item[index]) > maxlen:
            maxlen = len(item[index])

    return maxlen


def display_admins(admins: List[Any]) -> None:
    """Show all admins."""

    maxlens = {
        ADMIN_FIELDS[i]: max(max_length(admins, i), len(ADMIN_FIELDS[i]))
        for i in range(len(ADMIN_FIELDS))
    }

    print("   ".join([field.ljust(maxlens[field]) for field in ADMIN_FIELDS]))
    print("-" * (sum(list(maxlens.values())) + (3 * (len(maxlens) - 1))))

    for admin in admins:
        admin_fields = {
            ADMIN_FIELDS[i]: admin[i] for i in range(len(ADMIN_FIELDS))
        }
        print(
            "   ".join(
                [
                    admin_fields[field].ljust(maxlens[field])
                    for field in ADMIN_FIELDS
                ]
            )
        )


def main() -> None:
    """Process the command line arguments."""

    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="An admin utility")

    # Register as an admin
    parser.add_argument(
        "-a",
        "--add",
        type=str,
        default="",
        help="add user as admin",
    )

    # Remove admin status
    parser.add_argument(
        "-r",
        "--remove",
        type=str,
        default="",
        help="remove user's admin status",
    )

    # List all admins
    parser.add_argument(
        "-l",
        "--list",
        action="store_true",
        help="list all admins",
    )

    # Get the values of the arguments
    args = parser.parse_args()

    # Handle the add case
    if args.add:
        err = add_admin(args.add)
        print(f"Error: {err}" if err else "Added user as admin")

    # Handle the remove case next
    elif args.remove:
        err = remove_admin(args.remove)
        print(f"Error: {err}" if err else "Removed user's admin status")

    # Handle the list case last
    elif args.list:
        admins = list_admins()
        display_admins(admins)


if __name__ == "__main__":
    main()
