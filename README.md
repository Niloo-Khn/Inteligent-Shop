# Inteligent Shop

Seller dashboard for the generic multi-shop commerce platform. It connects to `Inteligent-Shop-backend` on port 4100 and runs locally on port 4180.

```bash
npm install --cache .npm-cache
npm run build
npm run serve
```

Current UI includes seller authentication, shop creation/switching, overview metrics, product publishing/editing, order history, buyer accounts, promotion setup, recommendation ordering, refunds, and incidents.

From **Products**, choose **Search AliExpress** to:

1. Search the official AliExpress affiliate catalog by keyword, destination, currency, and delivery window.
2. Review supplier price, rating, sales volume, image, and source ID.
3. Add the result directly as a safe draft, or use **AI improve + add** to rewrite only the title and description.
4. Edit quantity, retail pricing, copy, and shipping information before activating the product.

The backend must contain valid AliExpress credentials for search and an OpenAI API key for AI improvement. Keys are never stored in this frontend.
