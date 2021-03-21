import os

import env

from typing import Dict


def parse_db_url(url: str) -> Dict:
    """Parses database URL."""

    host_start_idx = url.index("@") + 1
    host_end_idx = url[host_start_idx:].index("/")
    host = url[host_start_idx : host_start_idx + host_end_idx]

    user_start_idx = url.index("mysql://") + 8
    user_end_idx = url[user_start_idx:].index(":")
    user = url[user_start_idx : user_start_idx + user_end_idx]

    password_start_idx = user_start_idx + user_end_idx + 1
    password_end_idx = host_start_idx - 1
    password = url[password_start_idx:password_end_idx]

    reconnect = url.find("reconnect=true") != -1

    name_start_idx = host_start_idx + host_end_idx + 1
    if reconnect:
        name_end_idx = url.index("?")
    else:
        name_end_idx = len(url)
    name = url[name_start_idx:name_end_idx]

    return {
        "host": host,
        "user": user,
        "password": password,
        "reconnect": reconnect,
        "name": name,
    }


def main() -> None:
    """Process the command line arguments."""

    envars = env.get_env(".env")
    args = parse_db_url(envars["DATABASE_URL"])

    cmd = f"mysql --host={args['host']} --user={args['user']} --password={args['password']}"
    if args["reconnect"]:
        cmd += " --reconnect"
    cmd += f" {args['name']}"

    os.system(cmd)


if __name__ == "__main__":
    main()
