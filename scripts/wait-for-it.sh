#!/usr/bin/env bash

postgres_url="${1}" # this is "postgres://testuser:testpassword@localhost:5433/local"
timeout="${2:-60}"
total_timeout="${timeout}"

echo "postgres_url: ${postgres_url}"
echo "timeout: ${timeout}"

host_port=$(echo "${postgres_url}" | cut -d@ -f2) # This is "localhost:5433/local"
host=$(echo "${host_port}" | cut -d: -f1) # This is "localhost"
port=$(echo "${host_port}" | cut -d: -f2 | cut -d/ -f1) # This is "5433"

echo "host: ${host}"
echo "port: ${port}"

until nc -zv "${host}" "${port}"
do
    ((timeout--))

    if [ "${timeout}" -eq 0 ]; then
        echo "command was never successful, aborting due to ${total_timeout}s timeout!"
        exit 1
    fi

    sleep 1
done

echo "🟢 - Database is ready!"