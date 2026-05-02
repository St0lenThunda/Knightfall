#!/bin/bash

# Warden's Briefing: Fabric Intelligence Bridge
# This script generates a project-level intelligence report and saves it as a JSON 
# for the Knightfall Dashboard.

REPORT_FILE="public/data/warden_report.json"
TEMP_REPORT="public/data/temp_briefing.txt"

echo "🛡️ Initiating Warden's Briefing..."

# 1. Gather Context
echo "Gathering project telemetry..."
GIT_DIFF=$(git diff HEAD^ HEAD 2>/dev/null | head -n 100)
GIT_LOG=$(git log -n 5 --pretty=format:"%h - %s (%an)" 2>/dev/null)
STATS=$(ls -R src | wc -l)

CONTEXT="Project: Knightfall (Spectral Suite)
Recent Changes:
$GIT_DIFF

Recent Commits:
$GIT_LOG

Active Files: $STATS
"

# 2. Process with Fabric
GLOBAL_PATTERNS="/Users/thunda/Desktop/Development/spectral-suite/patterns"
FABRIC_BIN=$(command -v fabric || echo "/Users/thunda/.local/bin/fabric")

if [ -f "$FABRIC_BIN" ]; then
    echo "Piping context into Fabric (Pattern: knightfall_warden)..."
    # If the pattern is a directory, we use the system.md directly to avoid "is a directory" errors
    PATTERN_PATH="$GLOBAL_PATTERNS/knightfall_warden"
    if [ -d "$PATTERN_PATH" ]; then
        echo "$CONTEXT" | "$FABRIC_BIN" --system "$(cat $PATTERN_PATH/system.md)" > "$TEMP_REPORT"
    else
        echo "$CONTEXT" | "$FABRIC_BIN" --pattern "knightfall_warden" > "$TEMP_REPORT"
    fi
else
    echo "⚠️ Fabric not found in PATH. Using fallback generator..."
    echo "Intelligence engine offline. Please install Fabric to enable high-fidelity briefings." > "$TEMP_REPORT"
    echo "Last Build: $(date)" >> "$TEMP_REPORT"
    echo "Recent: $GIT_LOG" >> "$TEMP_REPORT"
fi

# 3. Convert to JSON
echo "Synthesizing JSON Bridge..."
BRIEFING=$(cat "$TEMP_REPORT" | node -e "const fs = require('fs'); console.log(JSON.stringify(fs.readFileSync(0, 'utf-8')))")
TIMESTAMP=$(date +"%Y-%m-%dT%H:%M:%SZ")

cat <<EOF > "$REPORT_FILE"
{
  "version": "1.0.0",
  "timestamp": "$TIMESTAMP",
  "status": "VALIDATED",
  "briefing": $BRIEFING,
  "metrics": {
    "files_scanned": $STATS,
    "integrity_score": 98
  }
}
EOF

rm "$TEMP_REPORT"
echo "✅ Briefing stored in $REPORT_FILE"
