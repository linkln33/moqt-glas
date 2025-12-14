#!/bin/bash
# Cloudflare Pages build script
# This script is used by Cloudflare Pages to build the Next.js app

set -e

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building Next.js app..."
npm run build

echo "Building for Cloudflare Pages..."
npm run build:cloudflare

echo "Build complete!"
