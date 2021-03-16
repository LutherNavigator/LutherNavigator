import argparse
import os

import env


def main() -> None:
    """Process the command line arguments."""

    # Load the environment variables
    env.load_env(".env")

    # Parse command-line arguments
    parser = argparse.ArgumentParser(description="A testing utility")

    # Backend testing
    parser.add_argument(
        "-b",
        "--backend",
        action="store_true",
        help="backend testing mode",
    )

    # Run specific backend tests
    parser.add_argument(
        "-t",
        "--test",
        type=str,
        default="",
        metavar="testname",
        help="run specific backend tests",
    )

    # UI and mobile device emulation testing
    parser.add_argument(
        "-e",
        "--emulation",
        action="store_true",
        help="device emulation and UI testing mode",
    )

    # Get the values of the arguments
    args = parser.parse_args()

    # If run with `-b` or `--backend` argument
    if args.backend:
        os.system("npx jest --runInBand")
        os.system("npx jest-coverage-badges")

    # If run with `-t` or `--test` argument
    elif args.test:
        os.system(f"npx jest -t {args.test}")

    # If run with `-e` or `--emulation` argument
    if args.emulation:
        os.system("npx ts-node test/ui/uitest.ts")
        os.system("npx ts-node test/ui/mobile_emulation.ts")


if __name__ == "__main__":
    main()
