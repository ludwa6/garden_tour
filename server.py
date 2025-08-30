
#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 5000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Garden Tour PWA running on port {PORT}")
    print(f"Access at: http://0.0.0.0:{PORT}")
    httpd.serve_forever()
