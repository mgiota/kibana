#!/bin/bash

# Replace with your Elasticsearch credentials
ES_URL="<elasticsearch_url>"
USERNAME="<username>"
PASSWORD="<password>"

INCLUDE_DEGRADED=false
if [ "$1" == "--include-degraded" ]; then
  INCLUDE_DEGRADED=true
fi

# 1. Get all transforms and filter for SLO transforms
TRANSFORMS=$(curl -s -u $USERNAME:$PASSWORD "$ES_URL/_transform?size=1000" | jq -r '.transforms[] | select(.id | startswith("slo-")) | .id')

for TRANSFORM_ID in $TRANSFORMS; do
  echo "Checking transform: $TRANSFORM_ID"

  # 2. Get transform stats
  STATS=$(curl -s -u $USERNAME:$PASSWORD "$ES_URL/_transform/$TRANSFORM_ID/_stats")
  HEALTH=$(echo $STATS | jq -r '.transforms[0].health.status')

  # 3. Check health
  RESTART=false
  if [ "$HEALTH" != "green" ]; then
    if [ "$HEALTH" == "red" ]; then
      RESTART=true
    elif [ "$HEALTH" == "yellow" ] && [ "$INCLUDE_DEGRADED" == "true" ]; then
      RESTART=true
    fi
  fi

  if [ "$RESTART" == "true" ]; then
    echo "  Transform is unhealthy (status: $HEALTH). Restarting..."

    # 4. Stop the transform
    curl -s -u $USERNAME:$PASSWORD -X POST "$ES_URL/_transform/$TRANSFORM_ID/_stop"

    # Wait for the transform to stop
    sleep 5

    # 5. Start the transform
    curl -s -u $USERNAME:$PASSWORD -X POST "$ES_URL/_transform/$TRANSFORM_ID/_start"

    echo "  Transform restarted."
  else
    echo "  Transform is healthy or status is '$HEALTH' and --include-degraded is false."
  fi
done
