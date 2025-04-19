#!/bin/bash

# Script to insert 2 new bookings directly into the database
# 1. One booking that started and ended a month ago
# 2. One booking that starts in two weeks

# Supabase configuration
SUPABASE_URL="https://wzkikplsmgfnrsztlgyw.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6a2lrcGxzbWdmbnJzenRsZ3l3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5MjI0NjgsImV4cCI6MjA2MDQ5ODQ2OH0.eOyQdlXn4BIhj_ugsGv_rUSMonjxkYCG_bOjbQo9Vco"

# Get today's date and calculate dates for bookings
TODAY=$(date +"%Y-%m-%d")

# Calculate date 1 month ago
ONE_MONTH_AGO=$(date -v-1m +"%Y-%m-%d")

# Calculate date 1 month ago + 2 days (for the end date of first booking)
ONE_MONTH_AGO_PLUS_TWO=$(date -v-1m -v+2d +"%Y-%m-%d")

# Calculate date 2 weeks from now
TWO_WEEKS_FROM_NOW=$(date -v+2w +"%Y-%m-%d")

# Calculate date 2 weeks from now + 3 days (for the end date of second booking)
TWO_WEEKS_FROM_NOW_PLUS_THREE=$(date -v+2w -v+3d +"%Y-%m-%d")

echo "Dates calculated:"
echo "One month ago: $ONE_MONTH_AGO"
echo "One month ago + 2 days: $ONE_MONTH_AGO_PLUS_TWO"
echo "Two weeks from now: $TWO_WEEKS_FROM_NOW"
echo "Two weeks from now + 3 days: $TWO_WEEKS_FROM_NOW_PLUS_THREE"

# Using Buddy (ID: 115) and Luna (ID: 116) as the dogs for our bookings
DOG_ID_1=115  # Buddy
DOG_ID_2=116  # Luna

# Booking 1: One that started and ended a month ago (for Buddy)
BOOKING_1='{
  "dog_id": '$DOG_ID_1',
  "start_date": "'$ONE_MONTH_AGO'",
  "start_period": "morning",
  "end_date": "'$ONE_MONTH_AGO_PLUS_TWO'",
  "end_period": "evening",
  "color": "#3498db",
  "notes": "Past booking from a month ago"
}'

# Booking 2: One that starts in two weeks (for Luna)
BOOKING_2='{
  "dog_id": '$DOG_ID_2',
  "start_date": "'$TWO_WEEKS_FROM_NOW'",
  "start_period": "morning",
  "end_date": "'$TWO_WEEKS_FROM_NOW_PLUS_THREE'",
  "end_period": "evening",
  "color": "#2ecc71",
  "notes": "Future booking starting in two weeks"
}'

echo "Adding booking 1 (Past booking from a month ago for Buddy)..."
curl -s -X POST \
  "$SUPABASE_URL/rest/v1/bookings" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$BOOKING_1"

echo -e "\n\nAdding booking 2 (Future booking starting in two weeks for Luna)..."
curl -s -X POST \
  "$SUPABASE_URL/rest/v1/bookings" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "$BOOKING_2"

echo -e "\n\nBookings added successfully!" 