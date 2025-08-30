
#!/bin/bash
echo "Starting Garden Tour PWA on port 5000..."
echo "Files in directory:"
ls -la

# Try multiple server options in order of preference
if command -v python3 >/dev/null 2>&1; then
    echo "Using python3..."
    python3 server.py
elif command -v python >/dev/null 2>&1; then
    echo "Using python..."
    python server.py
elif command -v node >/dev/null 2>&1; then
    echo "Using node..."
    node server.js
else
    echo "No suitable server found. Available commands:"
    which python python3 node 2>/dev/null || echo "None of python, python3, or node are available"
    echo "Trying basic HTTP server..."
    python -m http.server 5000 --bind 0.0.0.0 2>/dev/null || echo "Failed to start any server"
fi
