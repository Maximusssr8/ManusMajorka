# Majorka — AliExpress Intelligence Extension

Chrome extension that overlays Majorka product intelligence directly on AliExpress product pages.

## Features

- Floating overlay on AliExpress product pages showing winning score, daily orders, and trend data
- Popup with API key configuration and quick stats from your Majorka account
- Automatic product matching via Majorka's search API
- 1-hour background cache to minimize API calls

## Install

1. Open `chrome://extensions` in Chrome
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** and select this `chrome-extension/` directory
4. The Majorka icon appears in the toolbar

## Setup

1. Get your API key at [majorka.io/app/api-keys](https://www.majorka.io/app/api-keys)
2. Click the Majorka extension icon in the toolbar
3. Paste your API key and click **Save**
4. Visit any AliExpress product page to see intelligence data

## How It Works

When you visit an AliExpress product page, the extension:

1. Extracts the product title from the page
2. Searches Majorka's database for a match
3. If found: shows a floating card with winning score, daily orders estimate, and trend direction
4. If not found: shows a badge with a link to import the product into Majorka

## Icon Generation

The `icons/` directory includes pre-generated PNG icons. For higher quality versions, open `icons/generate-icons.html` in Chrome and click "Download All PNGs".
