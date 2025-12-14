#!/bin/bash
# Cloudflare Pages build script
# This script is automatically used by Cloudflare Pages

set -e

echo "Installing dependencies with legacy-peer-deps..."
npm install --legacy-peer-deps

echo "Building Next.js app..."
npm run build

echo "Building for Cloudflare Pages..."
npm run build:cloudflare

echo "Build complete!"
