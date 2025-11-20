✅ Using sql.js (WASM SQLite, no build tools required)
✅ Transformers.js loaded: Xenova/all-MiniLM-L6-v2
[31m❌ Unknown reflexion subcommand: synthesize[0m

[1m[36m█▀█ █▀▀ █▀▀ █▄░█ ▀█▀ █▀▄ █▄▄
█▀█ █▄█ ██▄ █░▀█ ░█░ █▄▀ █▄█[0m

[1m[36mAgentDB CLI - Frontier Memory Features[0m

[1mUSAGE:[0m
  agentdb <command> <subcommand> [options]

[1mSETUP COMMANDS:[0m
  agentdb init [db-path] [--dimension 1536] [--preset small|medium|large] [--in-memory]
    Initialize a new AgentDB database (default: ./agentdb.db)
    Options:
      --dimension <n>     Vector dimension (default: 1536 for OpenAI, 768 for sentence-transformers)
      --preset <size>     small (<10K), medium (10K-100K), large (>100K vectors)
      --in-memory         Use temporary in-memory database (:memory:)

[1mVECTOR SEARCH COMMANDS:[0m
  agentdb vector-search <db-path> <vector> [-k 10] [-t 0.75] [-m cosine] [-f json] [-v] [--mmr [lambda]]
    Direct vector similarity search without text embeddings
    Arguments:
      <db-path>          Database file path (or :memory:)
      <vector>           Vector as JSON array [0.1,0.2,...] or space-separated numbers
    Options:
      -k <n>             Number of results (default: 10)
      -t <threshold>     Minimum similarity threshold (default: 0.0)
      -m <metric>        Similarity metric: cosine|euclidean|dot (default: cosine)
      -f <format>        Output format: json|table (default: json)
      -v                 Verbose mode with similarity scores
      --mmr [lambda]     Enable MMR diversity ranking (lambda: 0-1, default: 0.5)
                         0 = max diversity, 1 = max relevance
    Example: agentdb vector-search ./vectors.db "[0.1,0.2,0.3]" -k 10 -m cosine
    Example: agentdb vector-search ./vectors.db "[0.1,0.2,0.3]" --mmr 0.7

  agentdb export <db-path> [output-file] [--compress]
    Export all vectors and episodes to JSON file
    Options:
      --compress         Compress output with gzip (adds .gz extension)
      --output <file>    Output file path
    Example: agentdb export ./agentdb.db ./backup.json
    Example: agentdb export ./agentdb.db --compress --output backup.json.gz

  agentdb import <input-file> [db-path] [--decompress]
    Import vectors and episodes from JSON file
    Options:
      --decompress       Decompress gzip input (auto-detected for .gz files)
      --db <path>        Database file path
    Example: agentdb import ./backup.json ./new-db.db
    Example: agentdb import ./backup.json.gz --decompress

  agentdb stats [db-path]
    Show detailed database statistics and metrics
    Example: agentdb stats ./agentdb.db

[1mMCP COMMANDS:[0m
  agentdb mcp start
    Start the MCP server for Claude Desktop integration

[1mQUIC SYNC COMMANDS:[0m
  agentdb sync start-server [--port 4433] [--cert <path>] [--key <path>] [--auth-token <token>]
    Start a QUIC synchronization server for multi-agent coordination
    Options:
      --port <n>           Server port (default: 4433)
      --cert <path>        TLS certificate file path
      --key <path>         TLS key file path
      --auth-token <token> Authentication token (auto-generated if not provided)
    Example: agentdb sync start-server --port 4433 --cert ./cert.pem --key ./key.pem

  agentdb sync connect <host> <port> [--auth-token <token>] [--cert <path>]
    Connect to a remote QUIC sync server
    Arguments:
      <host>              Remote server hostname or IP
      <port>              Remote server port
    Options:
      --auth-token <token> Authentication token
      --cert <path>        TLS certificate for verification
    Example: agentdb sync connect 192.168.1.100 4433 --auth-token abc123

  agentdb sync push --server <host:port> [--incremental] [--filter <pattern>]
    Push local changes to remote server
    Options:
      --server <host:port> Remote server address (e.g., 192.168.1.100:4433)
      --incremental        Only push changes since last sync
      --filter <pattern>   Filter changes by pattern (e.g., "episodes", "skills")
    Example: agentdb sync push --server 192.168.1.100:4433 --incremental
    Example: agentdb sync push --server localhost:4433 --filter "episodes"

  agentdb sync pull --server <host:port> [--incremental] [--filter <pattern>]
    Pull remote changes from server
    Options:
      --server <host:port> Remote server address (e.g., 192.168.1.100:4433)
      --incremental        Only pull changes since last sync
      --filter <pattern>   Filter changes by pattern (e.g., "skills", "causal_edges")
    Example: agentdb sync pull --server 192.168.1.100:4433 --incremental
    Example: agentdb sync pull --server localhost:4433 --filter "skills"

  agentdb sync status
    Show synchronization status, pending changes, and connected servers
    Example: agentdb sync status

[1mCAUSAL COMMANDS:[0m
  agentdb causal add-edge <cause> <effect> <uplift> [confidence] [sample-size]
    Add a causal edge manually

  agentdb causal experiment create <name> <cause> <effect>
    Create a new A/B experiment

  agentdb causal experiment add-observation <experiment-id> <is-treatment> <outcome> [context]
    Record an observation (is-treatment: true/false)

  agentdb causal experiment calculate <experiment-id>
    Calculate uplift and statistical significance

  agentdb causal query [cause] [effect] [min-confidence] [min-uplift] [limit]
    Query causal edges with filters

[1mRECALL COMMANDS:[0m
  agentdb recall with-certificate <query> [k] [alpha] [beta] [gamma]
    Retrieve episodes with causal utility and provenance certificate
    Defaults: k=12, alpha=0.7, beta=0.2, gamma=0.1

[1mLEARNER COMMANDS:[0m
  agentdb learner run [min-attempts] [min-success-rate] [min-confidence] [dry-run]
    Discover causal edges from episode patterns
    Defaults: min-attempts=3, min-success-rate=0.6, min-confidence=0.7

  agentdb learner prune [min-confidence] [min-uplift] [max-age-days]
    Remove low-quality or old causal edges
    Defaults: min-confidence=0.5, min-uplift=0.05, max-age-days=90

[1mREFLEXION COMMANDS:[0m
  agentdb reflexion store <session-id> <task> <reward> <success> [critique] [input] [output] [latency-ms] [tokens]
    Store episode with self-critique

  agentdb reflexion retrieve <task> [--k <n>] [--min-reward <r>] [--only-failures] [--only-successes] [--synthesize-context] [--filters <json>]
    Retrieve relevant past episodes
    Options:
      --k <n>                Number of results (default: 5)
      --min-reward <r>       Minimum reward threshold
      --only-failures        Return only failed episodes
      --only-successes       Return only successful episodes
      --synthesize-context   Generate coherent summary with patterns and insights
      --filters <json>       MongoDB-style metadata filters (e.g., '{"metadata.year":{"$gte":2024}}')
    Example: agentdb reflexion retrieve "authentication" --k 10 --synthesize-context
    Example: agentdb reflexion retrieve "bug-fix" --filters '{"success":true,"reward":{"$gte":0.8}}'

  agentdb reflexion critique-summary <task> [only-failures]
    Get aggregated critique lessons

  agentdb reflexion prune [max-age-days] [max-reward]
    Clean up old or low-value episodes

[1mSKILL COMMANDS:[0m
  agentdb skill create <name> <description> [code]
    Create a reusable skill

  agentdb skill search <query> [k]
    Find applicable skills by similarity

  agentdb skill consolidate [min-attempts] [min-reward] [time-window-days] [extract-patterns]
    Auto-create skills from successful episodes with ML pattern extraction
    Defaults: min-attempts=3, min-reward=0.7, time-window-days=7, extract-patterns=true
    Analyzes: keyword frequency, critique patterns, reward distribution, metadata, learning curves

  agentdb skill prune [min-uses] [min-success-rate] [max-age-days]
    Remove underperforming skills (defaults: 3, 0.4, 60)

[1mDATABASE COMMANDS:[0m
  agentdb db stats
    Show database statistics

[1mHOOKS INTEGRATION COMMANDS:[0m
  agentdb query --query <query> [--domain <domain>] [--k <k>] [--min-confidence <conf>] [--format json] [--synthesize-context] [--filters <json>]
    Semantic search across stored episodes and patterns
    Options:
      --query <q>            Query string (required)
      --domain <d>           Domain filter (e.g., "successful-edits")
      --k <n>                Number of results (default: 5)
      --min-confidence <c>   Minimum confidence threshold (default: 0.0)
      --format <f>           Output format: json|text (default: json)
      --synthesize-context   Generate coherent summary with patterns and insights
      --filters <json>       MongoDB-style metadata filters
    Example: agentdb query --query "authentication" --k 5 --min-confidence 0.8 --synthesize-context
    Example: agentdb query --query "bug-fix" --filters '{"metadata.priority":"high"}' --synthesize-context

  agentdb store-pattern --type <type> --domain <domain> --pattern <json> --confidence <conf>
    Store a learned pattern for future retrieval
    Example: agentdb store-pattern --type "experience" --domain "code-edits" --pattern '{"success":true}' --confidence 0.9

  agentdb train --domain <domain> --epochs <n> --batch-size <n>
    Trigger pattern learning and skill consolidation
    Example: agentdb train --domain "code-edits" --epochs 10 --batch-size 32

  agentdb optimize-memory --compress <bool> --consolidate-patterns <bool>
    Memory consolidation, compression, and cleanup
    Example: agentdb optimize-memory --compress true --consolidate-patterns true

[1mENVIRONMENT:[0m
  AGENTDB_PATH    Database file path (default: ./agentdb.db)

[1mEXAMPLES:[0m
  # QUIC Sync: Multi-agent coordination
  # On server machine:
  agentdb sync start-server --port 4433 --auth-token secret123

  # On client machines:
  agentdb sync connect 192.168.1.100 4433 --auth-token secret123
  agentdb sync push --server 192.168.1.100:4433 --incremental
  agentdb sync pull --server 192.168.1.100:4433 --incremental
  agentdb sync status

  # Vector Search: Direct similarity queries
  agentdb init ./vectors.db --dimension 768 --preset medium
  agentdb vector-search ./vectors.db "[0.1,0.2,0.3]" -k 10 -m cosine -f json
  agentdb export ./vectors.db ./backup.json
  agentdb import ./backup.json ./new-vectors.db
  agentdb stats ./vectors.db

  # Reflexion: Store and retrieve episodes
  agentdb reflexion store "session-1" "implement_auth" 0.95 true "Used OAuth2"
  agentdb reflexion retrieve "authentication" 10 0.8
  agentdb reflexion critique-summary "bug_fix" true

  # Skills: Create and search
  agentdb skill create "jwt_auth" "Generate JWT tokens" "code here..."
  agentdb skill search "authentication" 5
  agentdb skill consolidate 3 0.7 7 true  # With pattern extraction
  agentdb skill consolidate 5 0.8 14      # Higher thresholds, longer window

  # Causal: Add edges and run experiments
  agentdb causal add-edge "add_tests" "code_quality" 0.25 0.95 100
  agentdb causal experiment create "test-coverage-quality" "test_coverage" "bug_rate"
  agentdb causal experiment add-observation 1 true 0.15
  agentdb causal experiment calculate 1

  # Retrieve with causal utility
  agentdb recall with-certificate "implement authentication" 10

  # Discover patterns automatically
  agentdb learner run 3 0.6 0.7

  # Get database stats
  agentdb db stats

