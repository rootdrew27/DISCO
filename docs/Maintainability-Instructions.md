# Maintainability Instructions

- Configuration
    - Use a .env.local file, and use `process.env.<config_option>` for loading configurations.

- Efficiency
    - Remove uncessary calls and inefficient logic.
    - Analyze overarching pattern(s) and change them if needed.
    - Use asynchronous programming if it can speed up the program.

- Typing
    - Add/improve interfaces and types.
    - Use enums when possible.

- Error Handling
    - Ensure all errors are properly handled.
    - Seperate error handling logic from application logic when possible.

- Logging
    - Create or improve existing logging mechanisms
    - Always log to files, in addition to stdout.

- General
    - It's better for the program to fail on start, than use improper values.
