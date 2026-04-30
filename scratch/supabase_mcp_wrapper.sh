#!/bin/zsh
# Knightfall Supabase MCP Wrapper
# Ensures the correct Node v24 environment and credentials are set for Antigravity.

export PATH="/Users/thunda/.nvm/versions/node/v24.15.0/bin:$PATH"
export SUPABASE_ACCESS_TOKEN="sbp_e6bd82ca2b9cfaa8333c21ef4e0fb47860c28ba0"
export SUPABASE_PROJECT_REF="qingaoyjdkiiexwmybps"

# Launch the server using the explicit Node binary to avoid shebang version mismatches.
/Users/thunda/.nvm/versions/node/v24.15.0/bin/node /Users/thunda/.nvm/versions/node/v24.15.0/bin/mcp-server-supabase
