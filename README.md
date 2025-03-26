# Amazon Product Scraper API

A high-performance web scraping API that extracts detailed product information from Amazon product pages. Built with Express.js, Puppeteer, and Bun runtime.

## Features

- Extracts comprehensive product details including:
  - Title and pricing information
  - Ratings and review count
  - Bank offers and discounts
  - Product features and technical specifications
  - High-resolution product images
  - Manufacturer images
  - Product summary
  - Technical specifications

## Prerequisites

- [Bun](https://bun.sh) v1.2.5 or higher

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/amazon-product-scrapper.git
cd amazon-product-scrapper
```

2. Install dependencies:

```bash
bun install
```

## Usage

1. Start the server:
```bash
bun run dev
```

The server will start on port 3000.

2. Make a POST request to `/product` endpoint with the product URL.

## API Endpoints

### POST /product
Scrapes product details from the provided Amazon product URL.

**Request Body:**
```json
{
    "productLink": "https://www.amazon.com/product-url"
}
```

**Success Response:**
```json
{
    "success": true,
    "productDetails": {},
    "title": "Product Title",
    "rating": "4.5 out of 5",
    "numberOfRatings": "1,234 ratings",
    "sellingPrice": "99.99",
    "totalDiscount": "20%",
    "bankOffers": [],
    "About this item": [],
    "Product Information": {},
    "High Resolution Images": [],
    "manufacturerImages": [],
    "summaryReview": "Product summary"
}
```

## Project Structure

- `/src`
  - `/controller` - Request handlers
  - `/routes` - API routes
  - `/scraper` - Puppeteer scraping logic
  - `index.ts` - Application entry point

## Technologies Used

- Bun - JavaScript runtime
- Express.js - Web framework
- Puppeteer - Web scraping
- TypeScript - Programming language
- Morgan - HTTP request logger
