#!/bin/bash

# Script to insert bookings using cURL - trying different column names

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

# First, try to fetch the schema information for the bookings table
echo "Fetching bookings table schema..."
curl -s -X GET \
  "${SUPABASE_URL}/rest/v1/?table=bookings" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Content-Type: application/json"

echo

# Try version 1 with 'notes' column
insert_booking_v1() {
  local dog_id=$1
  local start_date=$2
  local end_date=$3
  local notes=$4
  
  echo "Trying insert v1 with 'notes' column for dog ID $dog_id..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/bookings" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"dog_id\": $dog_id, \"start_date\": \"$start_date\", \"end_date\": \"$end_date\", \"notes\": \"$notes\"}"
  
  echo
}

# Try version 2 with 'note' column
insert_booking_v2() {
  local dog_id=$1
  local start_date=$2
  local end_date=$3
  local notes=$4
  
  echo "Trying insert v2 with 'note' column for dog ID $dog_id..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/bookings" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"dog_id\": $dog_id, \"start_date\": \"$start_date\", \"end_date\": \"$end_date\", \"note\": \"$notes\"}"
  
  echo
}

# Try version 3 with start_time/end_time columns
insert_booking_v3() {
  local dog_id=$1
  local start_date=$2
  local end_date=$3
  local notes=$4
  
  echo "Trying insert v3 with 'start_time' column for dog ID $dog_id..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/bookings" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"dog_id\": $dog_id, \"start_time\": \"$start_date\", \"end_time\": \"$end_date\", \"notes\": \"$notes\"}"
  
  echo
}

# Try version 4 with combination of columns
insert_booking_v4() {
  local dog_id=$1
  local start_date=$2
  local end_date=$3
  local notes=$4
  
  echo "Trying insert v4 with multiple column combinations for dog ID $dog_id..."
  curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/bookings" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"dog_id\": $dog_id, \"start_date\": \"$start_date\", \"end_date\": \"$end_date\", \"start_time\": \"$start_date\", \"end_time\": \"$end_date\", \"notes\": \"$notes\", \"note\": \"$notes\"}"
  
  echo
}

# Get all dogs
DOGS=$(get_dogs)
echo "Dogs retrieved: $DOGS"

# Get first dog ID
FIRST_DOG_ID=$(echo $DOGS | grep -o "\"id\":[0-9]*" | head -1 | cut -d':' -f2)
echo "Using dog ID: $FIRST_DOG_ID"

# Current date/time
NOW=$(get_date 0 10 0)
LATER=$(get_date 0 12 0)

# Try different insert versions
insert_booking_v1 $FIRST_DOG_ID "$NOW" "$LATER" "Test booking v1"
insert_booking_v2 $FIRST_DOG_ID "$NOW" "$LATER" "Test booking v2"
insert_booking_v3 $FIRST_DOG_ID "$NOW" "$LATER" "Test booking v3"
insert_booking_v4 $FIRST_DOG_ID "$NOW" "$LATER" "Test booking v4"

echo "Test inserts completed!" 