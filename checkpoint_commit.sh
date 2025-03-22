#! /bin/bash

# default message
message="checkpoint"

# if an argument is provided, use it as the message
if [ -n "$1" ]; then
    message="$1"
fi

git add .
git commit -m "$message"

