#!/bin/bash

# Ensure the folder path is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <folder_path>"
    exit 1
fi

# Get the folder path from the first argument
FOLDER_PATH="$1"

# Create the output folder if it doesn't exist
OUTPUT_FOLDER="$FOLDER_PATH/out"
mkdir -p "$OUTPUT_FOLDER"

# Iterate over all image files in the folder
for img in "$FOLDER_PATH"/*.{jpg,jpeg,png}; do
    if [ -f "$img" ]; then
        # Get the file extension and filename without extension
        extension="${img##*.}"
        filename="${img##*/}"
        filename="${filename%.*}"

        # Define the output filename with '--m' appended in the 'out' folder
        output_filename="${OUTPUT_FOLDER}/${filename}--m.${extension}"

        # Process the image
        magick "$img" -resize 640x400^ -gravity center -extent 640x400 "$output_filename"

        echo "Processed $img -> $output_filename"
    fi
done
