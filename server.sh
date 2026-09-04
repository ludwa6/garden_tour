#!/bin/sh
# Static preview server for the Bram target-app pane (see .bram.json).
#
# WHY THIS IS A SCRIPT AND NOT JUST THE COMMAND IN .bram.json
#
# Bram spawns this as a child with stderr on a pipe it reads, and does NOT
# terminate it when Bram exits — verified 2026-09-04: the process survives a
# clean Quit and is reparented to launchd, still holding the port.
#
# `python3 -m http.server` logs one line to stderr per request. Once Bram is
# gone nothing reads that pipe; Python ignores SIGPIPE, so the log write raises
# BrokenPipeError *inside the request handler*, the thread dies before sending
# a response, and every request then gets an empty reply while the port stays
# held. Bram's next launch reports "port 8080 is in use but unresponsive
# (empty reply); refusing to reuse" and will not start.
#
# Sending stderr to /dev/null removes the only thing that wedges it. The
# orphan then keeps serving correctly, and Bram reuses it on the next launch
# instead of refusing — which turns the leak from a blocker into a no-op.
#
# The redirect lives here rather than in .bram.json because it is unknown
# whether Bram passes `server.command` through a shell; if it splits argv
# itself, `2>/dev/null` would become a literal argument and break the server.
#
# Usage: ./server.sh [port]   (default 8080, matching .bram.json)
PORT="${1:-8080}"
exec python3 -m http.server "$PORT" 2>/dev/null
