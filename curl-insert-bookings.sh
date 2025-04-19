#!/bin/bash

# Script to insert bookings using cURL

# Supabase configuration
SUPABASE_URL="https://wzkikplsmgfnrsztlgyw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco"

# Function to get today's date in ISO format
get_date() {
  local days=$1
  local hours=$2
  local minutes=$3
  
  # Get current date in ISO format and add days
  date -v+${days}d -v${hours}H -v${minutes}M +"%Y-%m-%dT%H:%M:%S%z"
}

# Function to get dogs
get_dogs() {
  echo "Fetching dogs..."
  curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/dogs?select=id,name" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json"
}

# Function to extract dog ID by name
get_dog_id() {
  local dogs_json=$1
  local dog_name=$2
  
  # Extract ID for the specified dog name
  echo $dogs_json | grep -o "{[^}]*\"name\":\"$dog_name\"[^}]*}" | grep -o "\"id\":[0-9]*" | cut -d':' -f2
}

# Function to insert a booking
insert_booking() {
  local dog_id=$1
  local start_date=$2
  local end_date=$3
  local notes=$4
  
  echo "Inserting booking for dog ID $dog_id..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/bookings" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"dog_id\": $dog_id, \"start_date\": \"$start_date\", \"end_date\": \"$end_date\", \"notes\": \"$notes\"}"
  
  echo
}

# Get all dogs
DOGS=$(get_dogs)
echo "Dogs retrieved: $DOGS"

# Find specific dog IDs
BUDDY_ID=$(get_dog_id "$DOGS" "Buddy")
LUNA_ID=$(get_dog_id "$DOGS" "Luna")
MAX_ID=$(get_dog_id "$DOGS" "Max")
BELLA_ID=$(get_dog_id "$DOGS" "Bella")
CHARLIE_ID=$(get_dog_id "$DOGS" "Charlie")

# Fallback to first dog if specific dog not found
if [ -z "$BUDDY_ID" ]; then
  BUDDY_ID=$(echo $DOGS | grep -o "\"id\":[0-9]*" | head -1 | cut -d':' -f2)
fi

if [ -z "$LUNA_ID" ]; then
  LUNA_ID=$BUDDY_ID
fi

if [ -z "$MAX_ID" ]; then
  MAX_ID=$BUDDY_ID
fi

if [ -z "$BELLA_ID" ]; then
  BELLA_ID=$BUDDY_ID
fi

if [ -z "$CHARLIE_ID" ]; then
  CHARLIE_ID=$BUDDY_ID
fi

echo "Using dog IDs: Buddy=$BUDDY_ID, Luna=$LUNA_ID, Max=$MAX_ID, Bella=$BELLA_ID, Charlie=$CHARLIE_ID"

# Insert bookings
insert_booking $BUDDY_ID "$(get_date 0 9 0)" "$(get_date 0 12 0)" "Morning stay"
insert_booking $LUNA_ID "$(get_date 0 10 0)" "$(get_date 0 14 0)" "Midday play session"
insert_booking $MAX_ID "$(get_date 0 13 0)" "$(get_date 0 17 0)" "Afternoon care"

insert_booking $BELLA_ID "$(get_date 1 8 0)" "$(get_date 1 12 0)" "Early drop-off"
insert_booking $CHARLIE_ID "$(get_date 1 11 0)" "$(get_date 1 15 0)" "Lunch and playtime"
insert_booking $BUDDY_ID "$(get_date 1 14 0)" "$(get_date 1 18 0)" "Late afternoon session"

echo "All bookings inserted!" 