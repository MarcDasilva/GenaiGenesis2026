# NCBI Datasets MCP

FastMCP server exposing NCBI Datasets API as MCP tools and resources.

## Run

**Stdio (default)** — for Cursor/IDE MCP:

```bash
python -m unofficial_ncbi_mcp
```

**HTTP** — for remote clients:

```bash
MCP_TRANSPORT=http python -m unofficial_ncbi_mcp
```

Listens on `http://127.0.0.1:8000` (override with `MCP_HOST`, `MCP_PORT`).

## Endpoints

| Path     | Method | Purpose |
|----------|--------|--------|
| `/`      | GET    | Service info (plain JSON, no special headers) |
| `/health`| GET    | Health check (plain JSON) |
| `/mcp`   | POST (then GET) | MCP Streamable HTTP — **POST first to initialize and get session** |

- **Health / root:** `curl http://127.0.0.1:8000/` or `curl http://127.0.0.1:8000/health` (no special headers).
- **MCP `/mcp`** uses the Streamable HTTP transport: the client must **POST first** with a JSON-RPC `initialize` request; the server responds with `Mcp-Session-Id` in the response headers. Use that session id for later requests. A plain GET to `/mcp` returns `"Bad Request: Missing session ID"` because no session was created yet.

  **Verify MCP with curl (initialize handshake):**
  ```bash
  curl -s -X POST http://127.0.0.1:8000/mcp \
    -H "Content-Type: application/json" \
    -H "Accept: application/json, text/event-stream" \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
  ```
  Check the response for JSON-RPC result and the `Mcp-Session-Id` response header. Cursor and other MCP clients do this automatically when you add the server URL (e.g. `http://127.0.0.1:8000/mcp`).

## Tools & resources

Tools: `search_genomes`, `get_genome_info`, `search_genes`, `get_gene_info`, `search_taxonomy`, `get_taxonomy_info`, `search_assemblies`, `get_assembly_info`, and others.  
Resources: `ncbi://genome/{accession}`, `ncbi://gene/{gene_id}`, `ncbi://taxonomy/{tax_id}`, etc.

## Config

- `NCBI_API_KEY` — optional NCBI API key
- `NCBI_BASE_URL` — defaults to `https://api.ncbi.nlm.nih.gov/datasets/v2`
- `MCP_TRANSPORT` — `stdio` or `http`
- `MCP_HOST` / `MCP_PORT` — when `MCP_TRANSPORT=http`
