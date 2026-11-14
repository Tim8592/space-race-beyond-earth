#!/bin/bash
# Optional Orekit transfer solver; Java + Maven are separate from Node.js.
cd "$(dirname "$0")" || exit 1
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

if ! command -v java >/dev/null 2>&1; then
  echo "JDK 17+ not found. Install a Java 17+ JDK, then try again."
  read -r -p "Press Return to close..."
  exit 1
fi

if ! command -v mvn >/dev/null 2>&1; then
  echo "Apache Maven not found. Install Maven (Homebrew: brew install maven), then try again."
  read -r -p "Press Return to close..."
  exit 1
fi

echo "Building and testing the optional Orekit backend..."
if ! mvn -q -f orekit-service/pom.xml package; then
  echo "Orekit Maven build or tests failed; read the output above."
  read -r -p "Press Return to close..."
  exit 1
fi

echo "Starting the local Orekit service on 127.0.0.1:8787"
echo "Keep this window open while solving transfers. Control+C stops the service."
java -jar orekit-service/target/orekit-transfer-service-0.4.0.jar
status=$?
if [ "$status" -ne 0 ]; then
  read -r -p "Press Return to close..."
fi
exit "$status"
