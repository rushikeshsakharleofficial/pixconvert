import http.server, socketserver, os

class Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        if str(path).endswith('.jsx'):
            return 'application/javascript'
        return super().guess_type(path)
    def log_message(self, format, *args):
        print(f"  {args[0]} {args[1]}")

os.chdir('/home/rushikesh.sakharle/projects/fileconverter')
socketserver.TCPServer.allow_reuse_address = True
print("Serving at http://localhost:8080")
with socketserver.TCPServer(("", 8080), Handler) as httpd:
    httpd.serve_forever()
